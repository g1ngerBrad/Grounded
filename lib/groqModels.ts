import Groq, { APIError } from "groq-sdk";
import type { ChatCompletionCreateParamsNonStreaming } from "groq-sdk/resources/chat/completions";

/**
 * Models this app is happy to use, best first.
 *
 * Groq retires models on a rolling basis, so this list is a *preference*, not
 * a promise. Every id is checked against Groq's live catalogue before it is
 * used, and anything that has been decommissioned is skipped silently. A model
 * dying should never take the app down — at worst it drops to the next entry.
 *
 * Every entry must support `response_format: { type: "json_object" }`, because
 * the reflection routes parse the reply as JSON.
 */
const PREFERRED_MODELS = [
  // Reachable on a standard Groq key.
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  // Enterprise-tier only as of Sep 2026. Harmless to keep: a key without the
  // entitlement skips straight past them.
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "minimaxai/minimax-m2.7",
];

/** Live models that exist but can't do chat: audio, safety, embeddings. */
const NOT_CHAT = /whisper|tts|embed|guard|moderation|orpheus|speech/i;

const CATALOGUE_TTL_MS = 10 * 60 * 1000;

/**
 * Groq's catalogue is the same for every account on the public tier, so one
 * process-wide cache is enough. It is only ever a cache: a miss or a stale
 * entry costs an extra request, never a wrong answer, because a model that
 * disappears between refreshes is caught by the retry in `completeJson`.
 */
type Catalogue = {
  /** Every live model id, newest first. */
  ids: string[];
  has: Set<string>;
  fetchedAt: number;
};

let catalogue: Catalogue | null = null;
let inFlight: Promise<Catalogue | null> | null = null;

/** Thrown when every candidate model has been tried and none worked. */
export class NoUsableModelError extends Error {
  constructor(readonly tried: string[]) {
    super(`No usable Groq model. Tried: ${tried.join(", ") || "(none)"}`);
    this.name = "NoUsableModelError";
  }
}

export function invalidateModelCatalogue() {
  catalogue = null;
}

async function liveModels(groq: Groq): Promise<Catalogue | null> {
  if (catalogue && Date.now() - catalogue.fetchedAt < CATALOGUE_TTL_MS) {
    return catalogue;
  }
  // Collapse concurrent refreshes so a burst of requests makes one call.
  inFlight ??= (async () => {
    try {
      const { data } = await groq.models.list();
      const ids = [...data]
        .sort((a, b) => b.created - a.created)
        .map((m) => m.id);
      catalogue = { ids, has: new Set(ids), fetchedAt: Date.now() };
      return catalogue;
    } catch (err) {
      // Discovery is best-effort. If it fails we still want to try the call.
      console.warn("Groq model discovery failed; using preference order blind:", err);
      return null;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/**
 * The ordered list of models to attempt for one request.
 *
 * `GROQ_MODEL` pins a specific model to the front when set, but does not lock
 * the app to it — a pin that has been decommissioned is reported and skipped
 * rather than being allowed to break every reflection.
 */
export async function resolveModelChain(groq: Groq): Promise<string[]> {
  const pinned = process.env.GROQ_MODEL?.trim();
  const preferred = pinned
    ? [pinned, ...PREFERRED_MODELS.filter((m) => m !== pinned)]
    : PREFERRED_MODELS;

  const live = await liveModels(groq);
  if (!live) return preferred;

  if (pinned && !live.has.has(pinned)) {
    console.warn(
      `GROQ_MODEL is set to "${pinned}", which Groq no longer offers. ` +
        `Falling back to the next available model — update or unset GROQ_MODEL.`,
    );
  }

  const chain = preferred.filter((m) => live.has.has(m));
  if (chain.length > 0) return chain;

  // Nothing we know by name survived. Rather than fail, use whatever chat
  // models the account can actually reach, newest first — a newer model is the
  // better guess when we have nothing else to go on.
  console.warn(
    "None of the preferred Groq models are available; falling back to the live catalogue. " +
      "Update PREFERRED_MODELS in lib/groqModels.ts.",
  );
  return live.ids.filter((id) => !NOT_CHAT.test(id));
}

/**
 * Does this error mean "use a different model", as opposed to a real failure?
 *
 * Two shapes count. The model is *gone* (retired, renamed, never existed), or
 * it exists but this key can't have it — Groq moved the Llama models to the
 * enterprise tier, which reads as a 403 on an otherwise valid key. Both are
 * fixed by moving down the chain; neither means the key is bad.
 */
export function isModelUnavailable(err: unknown): boolean {
  if (!(err instanceof APIError)) return false;
  if (err.status !== 400 && err.status !== 403 && err.status !== 404) return false;

  const body = err.error as { error?: { code?: string; message?: string } } | undefined;
  const code = body?.error?.code ?? "";
  if (code === "model_not_found" || code === "model_decommissioned") return true;

  const message = `${body?.error?.message ?? ""} ${err.message}`.toLowerCase();
  if (/decommission|model_not_found|no longer (?:available|supported)|does not exist|unknown model|is not supported/.test(message)) {
    return true;
  }
  // Entitlement, not authentication — only ever read this way on a 403, so a
  // genuinely rejected key (401) still surfaces as a key problem.
  return (
    err.status === 403 &&
    /model|tier|entitle|not authorized|does not have access|enterprise|plan/.test(message)
  );
}

/**
 * Run a chat completion against the first model that works, walking the chain
 * whenever a model turns out to be gone. Errors that are *not* about model
 * availability (auth, rate limits, network) are thrown straight through —
 * retrying those on another model would only burn quota.
 */
export async function completeJson(
  groq: Groq,
  params: Omit<ChatCompletionCreateParamsNonStreaming, "model">,
): Promise<{ content: string; model: string }> {
  const chain = await resolveModelChain(groq);
  const tried: string[] = [];

  for (const model of chain) {
    tried.push(model);
    try {
      const completion = await groq.chat.completions.create({ ...params, model });
      return { content: completion.choices[0]?.message?.content ?? "", model };
    } catch (err) {
      if (!isModelUnavailable(err)) throw err;
      // The catalogue said this model existed; it doesn't. Refresh it so the
      // next request doesn't repeat the same dead hop.
      invalidateModelCatalogue();
      console.warn(`Groq model "${model}" is unavailable; trying the next one.`);
    }
  }

  throw new NoUsableModelError(tried);
}
