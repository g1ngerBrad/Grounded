import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { fetchVerse, type Verse } from "@/lib/bible";

export const runtime = "nodejs";

const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const MAX_INPUT_CHARS = 4000;

type PromptType = "facts" | "decision";
type Complexity = "simple" | "moderate" | "complex";

const COMPLEXITY_GUIDANCE: Record<Complexity, string> = {
  simple:
    "This is a simple, everyday decision (e.g. where to eat). Keep it light and brief: offer 2 options, short considerations, and 1-2 questions to sit with. Don't over-spiritualize a small choice.",
  moderate:
    "This is a moderately weighty decision. Give 2-3 options with balanced considerations and 2-3 questions to sit with.",
  complex:
    "This is a complex, life-shaping decision (e.g. career, relationships, relocation). Be thorough: offer 3-4 options, surface deeper considerations and trade-offs, and provide 3-4 reflective questions to sit with.",
};

const SYSTEM_PROMPTS: Record<PromptType, string> = {
  facts: `You are a calm Christian thinking aid using a CBT-style fact/assumption split.
Respond ONLY with valid JSON, no markdown, matching:
{"title": string, "facts": string[], "assumptions": string[], "note": string, "verse": {"reference": string, "text": string, "translation": "KJV"|"WEB"}}
- "title": a short, specific label (3-6 words, no trailing punctuation) summarizing what this is about, e.g. "Whether to take the new job". Capture the heart of the situation, not just the first words.
- "facts": objectively verifiable statements drawn ONLY from the user's text. If none are clearly objective, return an empty array — do not invent facts.
- "assumptions": fears/predictions/interpretations the user is treating as fact.
- "note": 1-2 gentle sentences on why naming the difference helps.
- "verse": a real, well-known KJV or WEB verse on truth or peace, quoted accurately.`,

  decision: `You are a calm Christian discernment guide. The user faces a dilemma.
Respond ONLY with valid JSON, no markdown, matching:
{"dilemma": string, "options": [{"name": string, "considerations": string[], "tradeoffs": string}], "recommendation": {"choice": string, "reason": string}, "questions_to_pray": string[], "verse": {"reference": string, "text": string, "translation": "KJV"|"WEB"}, "note": string}
- "options": lay out 2-4 realistic options the user is weighing, each with honest considerations and a trade-off.
- "recommendation.choice": MUST exactly match one option's "name". Commit to a single best option given the user's specific situation. Never hedge, never answer "it depends", never say both are equally good.
- "recommendation.reason": 1-3 sentences giving the clear, concrete reason this option is best given what the user actually described.
- "questions_to_pray": 2-4 reflective questions for discernment.
- "verse": a real, well-known KJV or WEB verse on wisdom/peace/discernment, quoted accurately.
- "note": affirm the final choice is theirs to make in peace — but still leave them with a clear recommendation to react to, not pressure.`,
};

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-groq-key")?.trim() || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "No Groq API key. Add one in Settings, or configure the server." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { type, text, complexity } = (body ?? {}) as {
    type?: string;
    text?: string;
    complexity?: string;
  };

  if (!type || !["facts", "decision"].includes(type)) {
    return NextResponse.json({ error: "Invalid prompt type." }, { status: 400 });
  }
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Please write something first." }, { status: 400 });
  }

  const level: Complexity =
    complexity === "simple" || complexity === "complex" ? complexity : "moderate";

  let system = SYSTEM_PROMPTS[type as PromptType];
  if (type === "decision") {
    system += `\n${COMPLEXITY_GUIDANCE[level]}`;
  }

  const clipped = text.slice(0, MAX_INPUT_CHARS);
  const groq = new Groq({ apiKey });

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: clipped },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed) {
      return NextResponse.json(
        { error: "Couldn't read the response. Please try again." },
        { status: 502 }
      );
    }

    const data = parsed as { verse?: Verse; title?: string };
    if (data.verse?.reference) {
      const accurate = await fetchVerse(data.verse.reference);
      if (accurate) data.verse = accurate;
    }

    if (type === "facts" && !data.title?.trim()) {
      const firstLine = clipped.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
      data.title = firstLine.length > 60 ? `${firstLine.slice(0, 60).trimEnd()}…` : firstLine;
    }

    return NextResponse.json({ type, data });
  } catch (err) {
    console.error("Groq request failed:", err);
    return NextResponse.json(
      { error: "Something went wrong reaching the assistant." },
      { status: 502 }
    );
  }
}