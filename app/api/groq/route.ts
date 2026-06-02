import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { fetchVerse, type Verse } from "@/lib/bible";

export const runtime = "nodejs";

const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const MAX_INPUT_CHARS = 4000;

type PromptType = "dump" | "facts" | "decision";

const SYSTEM_PROMPTS: Record<PromptType, string> = {
  dump: `You are a calm, grounded Christian companion. The user will dump anxious thoughts.
Respond ONLY with valid JSON, no markdown, matching:
{"summary": string, "worries": string[], "verse": {"reference": string, "text": string, "translation": "KJV"|"WEB"}, "reassurance": string}
- "summary": 1-2 sentences naming the core worry beneath the noise.
- "worries": 2-4 short bullet phrases.
- "verse": a WELL-KNOWN, real Bible verse about peace/trust. Use only KJV or WEB (public domain). Quote it accurately. If unsure of exact wording, pick a verse you are certain of.
- "reassurance": 2-3 warm sentences. Do not be preachy or dismissive of their feelings.`,

  facts: `You are a calm Christian thinking aid using a CBT-style fact/assumption split.
Respond ONLY with valid JSON, no markdown, matching:
{"facts": string[], "assumptions": string[], "note": string, "verse": {"reference": string, "text": string, "translation": "KJV"|"WEB"}}
- "facts": objectively verifiable statements drawn ONLY from the user's text. If none are clearly objective, return an empty array — do not invent facts.
- "assumptions": fears/predictions/interpretations the user is treating as fact.
- "note": 1-2 gentle sentences on why naming the difference helps.
- "verse": a real, well-known KJV or WEB verse on truth or peace, quoted accurately.`,

  decision: `You are a calm Christian discernment guide. The user faces a dilemma.
Respond ONLY with valid JSON, no markdown, matching:
{"dilemma": string, "options": [{"name": string, "considerations": string[], "tradeoffs": string}], "questions_to_pray": string[], "verse": {"reference": string, "text": string, "translation": "KJV"|"WEB"}, "note": string}
- DO NOT recommend, rank, or choose an option. Lay them out neutrally.
- "questions_to_pray": 2-4 reflective questions for discernment.
- "verse": a real, well-known KJV or WEB verse on wisdom/peace/discernment, quoted accurately.
- "note": remind them the choice is theirs to make in peace, not pressure.`,
};

export async function POST(req: NextRequest) {
  // Prefer a user-supplied key (kept in their browser, sent per-request and
  // never stored or logged here); fall back to the server's env var.
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

  const { type, text } = (body ?? {}) as { type?: string; text?: string };

  if (!type || !["dump", "facts", "decision"].includes(type)) {
    return NextResponse.json({ error: "Invalid prompt type." }, { status: 400 });
  }
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Please write something first." }, { status: 400 });
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
        { role: "system", content: SYSTEM_PROMPTS[type as PromptType] },
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

    // Replace the model's (potentially imprecise) verse text with the exact
    // wording from API.Bible, looked up by the reference it chose. Falls back
    // to the model's text if API.Bible is unconfigured or the lookup fails.
    const data = parsed as { verse?: Verse };
    if (data.verse?.reference) {
      const accurate = await fetchVerse(data.verse.reference);
      if (accurate) data.verse = accurate;
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