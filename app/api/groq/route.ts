import { NextRequest, NextResponse } from "next/server";
import Groq, { APIError } from "groq-sdk";
import { fetchVerse, type Verse } from "@/lib/bible";
import { completeJson, NoUsableModelError } from "@/lib/groqModels";

export const runtime = "nodejs";

const MAX_INPUT_CHARS = 4000;

type ErrorCode =
  | "no_key"
  | "invalid_key"
  | "bad_request"
  | "rate_limited"
  | "no_model"
  | "bad_response"
  | "upstream";

const fail = (code: ErrorCode, error: string, status: number) =>
  NextResponse.json({ error, code }, { status });

type PromptType = "facts" | "decision";
type Complexity = "simple" | "moderate" | "complex";

const COMPLEXITY_GUIDANCE: Record<Complexity, string> = {
  simple:
    "This is a simple, everyday decision (e.g. where to eat). Keep it tight: 2 options, one or two crisp considerations each, and 1-2 follow-up questions. Don't over-think or over-spiritualize a small choice — just call it.",
  moderate:
    "This is a moderately weighty decision. Give 2-3 options with concrete considerations and 2-3 sharp questions. Land firmly on one.",
  complex:
    "This is a complex, life-shaping decision (e.g. career, relationships, relocation). Be thorough but still decide: 3-4 options, real trade-offs, 3-4 pointed questions. Weight matters more — so make the case for your pick clearly, don't retreat into 'it's a big decision'.",
};

const SYSTEM_PROMPTS: Record<PromptType, string> = {
  facts: `You are a sharp, grounded Christian thinking aid. You take someone's brain-dump about a situation and separate what is actually KNOWN to be true from what they are merely ASSUMING, using a CBT-style fact/assumption split. Your job is clarity, not comfort. Be direct, concrete, and brief. Never coddle, never pad with reassurance, never use therapy-speak ("it's understandable that…", "your feelings are valid").
Respond ONLY with valid JSON, no markdown, matching:
{"title": string, "facts": string[], "assumptions": string[], "note": string, "verse": {"reference": string}}
- "title": a short, specific label (3-6 words, no trailing punctuation) naming the real issue, e.g. "Whether to take the new job". Capture the heart of it, not the first words.
- "facts": short, concrete, verifiable statements drawn ONLY from the user's text — what is actually known to be true right now. Keep the substance, drop the interpretation. If nothing is clearly objective, return an empty array — never invent facts.
- "assumptions": the interpretations, predictions, and beliefs the user is treating as established fact — whether hopeful, neutral, or worried. State each one plainly, then name the leap in parentheses where one is clear, e.g. "They'll think less of me (mind-reading)", "This is my only chance (all-or-nothing thinking)", "It will definitely work out (assuming an unconfirmed outcome)". Flag anywhere a conclusion outruns the evidence — not only the negative ones.
- "note": 1-2 sentences. State what separating fact from assumption reveals here and what the user can therefore act on. End on something actionable, not soothing.
- "verse": choose ONE real, well-known Bible verse on truth, trust, or peace that speaks to THIS situation. Return ONLY its "reference" (e.g. "Philippians 4:6-7"). Do NOT include the verse text — it is fetched separately. Use a standard book/chapter:verse reference.`,

  decision: `You are a decisive Christian counselor. The user is stuck on a decision. Your job is to weigh the real options and tell them what to do and why — then point them at the first step. You are NOT a therapist: do not validate feelings, soothe insecurities, hedge, or hand the decision back. Wise counsel commits.
Base your reasoning on what is actually known to be true, not on the user's unverified assumptions. When a fact/assumption breakdown is provided below, it is YOUR OWN prior analysis of this same reflection — rely on it directly. If none is provided, separate fact from assumption yourself before deciding.
Respond ONLY with valid JSON, no markdown, matching:
{"dilemma": string, "options": [{"name": string, "considerations": string[], "tradeoffs": string}], "recommendation": {"choice": string, "reason": string}, "questions_to_pray": string[], "verse": {"reference": string}, "note": string}
- "dilemma": the real decision in one sharp sentence.
- "options": 2-4 genuinely viable options the user is actually weighing — never filler options added for false balance. Each gets concrete, specific considerations and one honest trade-off. Option "name" must be short (2-6 words).
- "recommendation.choice": MUST exactly match one option's "name". Commit to the single best option. Never hedge, never say "it depends", never call two options equally good, never defer back to the user.
- "recommendation.reason": 2-4 sentences making a confident, concrete case grounded in the user's actual situation and the established facts (not their assumptions). Lead with the single strongest reason. If the recommendation runs counter to an assumption the user voiced, say so plainly.
- "questions_to_pray": 2-4 pointed questions that pressure-test the decision or surface what only the user can know (values, calling, who's affected). Sharpen the choice — no vague emotional check-ins.
- "verse": choose ONE real, well-known Bible verse on wisdom, courage, or trusting God in a decision that fits THIS situation. Return ONLY its "reference" (e.g. "James 1:5"). Do NOT include the verse text — it is fetched separately. Use a standard book/chapter:verse reference.
- "note": 1-2 sentences. Reinforce the recommendation and name the single concrete FIRST STEP the user should take to act on it. The choice is theirs, but do not dilute it with "whatever feels right" or open-ended reassurance.`,
};

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-groq-key")?.trim() || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return fail(
      "no_key",
      "No Groq API key. Add one in Settings, or configure the server.",
      401,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", "Invalid JSON body.", 400);
  }

  const { type, text, complexity, facts, assumptions } = (body ?? {}) as {
    type?: string;
    text?: string;
    complexity?: string;
    facts?: unknown;
    assumptions?: unknown;
  };

  const toStringList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];

  if (!type || !["facts", "decision"].includes(type)) {
    return fail("bad_request", "Invalid prompt type.", 400);
  }
  if (typeof text !== "string" || text.trim().length === 0) {
    return fail("bad_request", "Please write something first.", 400);
  }

  const level: Complexity =
    complexity === "simple" || complexity === "complex" ? complexity : "moderate";

  let system = SYSTEM_PROMPTS[type as PromptType];
  if (type === "decision") {
    system += `\n${COMPLEXITY_GUIDANCE[level]}`;

    const factList = toStringList(facts);
    const assumptionList = toStringList(assumptions);
    if (factList.length || assumptionList.length) {
      const fmt = (items: string[]) =>
        items.length ? items.map((s) => `- ${s}`).join("\n") : "- (none identified)";
      system +=
        `\n\nYou previously sorted this same reflection into the following fact/assumption split. This is your own prior analysis — treat it as established and build your decision on it. The user's original reflection is provided as the user message for reference.\n` +
        `Facts (known to be true):\n${fmt(factList)}\n` +
        `Assumptions (interpretations, not established as fact):\n${fmt(assumptionList)}`;
    }
  }

  const clipped = text.slice(0, MAX_INPUT_CHARS);
  const groq = new Groq({ apiKey });

  try {
    const { content: raw, model } = await completeJson(groq, {
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: clipped },
      ],
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed) {
      return fail("bad_response", "Couldn't read the response. Please try again.", 502);
    }

    const data = parsed as { verse?: Verse; title?: string };
    if (data.verse?.reference) {
      data.verse = (await fetchVerse(data.verse.reference)) ?? undefined;
    } else {
      data.verse = undefined;
    }

    if (type === "facts" && !data.title?.trim()) {
      const firstLine = clipped.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
      data.title = firstLine.length > 60 ? `${firstLine.slice(0, 60).trimEnd()}…` : firstLine;
    }

    return NextResponse.json({ type, data, model });
  } catch (err) {
    console.error("Groq request failed:", err);

    // Every model in the chain is gone — a config problem, not a blip, so say
    // so plainly instead of inviting the user to retry into the same wall.
    if (err instanceof NoUsableModelError) {
      return fail(
        "no_model",
        "No AI model is currently available on your Groq account. If this persists, the app's model list may need updating.",
        503,
      );
    }

    if (err instanceof APIError) {
      if (err.status === 401 || err.status === 403) {
        return fail(
          "invalid_key",
          "Groq rejected your API key. Check it in Settings, or create a new one.",
          401,
        );
      }
      if (err.status === 429) {
        return fail(
          "rate_limited",
          "Groq is rate-limiting this key. Wait a moment and try again.",
          429,
        );
      }
    }

    return fail("upstream", "Something went wrong reaching the assistant.", 502);
  }
}