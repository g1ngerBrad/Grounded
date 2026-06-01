// Fetches real scripture text from API.Bible (https://scripture.api.bible).
// Used server-side so the API key never reaches the client.
//
// Configure with environment variables:
//   BIBLE_API_KEY  — your API.Bible key (required for live verses)
//   BIBLE_ID       — bible id to read from (defaults to public-domain KJV)
//   BIBLE_NAME     — short label shown to users (defaults to "KJV")

const API_BASE = "https://api.scripture.api.bible/v1";
// Public-domain King James Version — a safe default that needs no licensing.
const DEFAULT_BIBLE_ID = "de4e12af7f28f599-02";

export type Verse = { reference: string; text: string; translation: string };

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\d+\]/g, "") // verse-number markers
    .replace(/\s+/g, " ")
    .trim();

/**
 * Look up a verse/passage by human reference (e.g. "Philippians 4:6-7").
 * Returns null when the API is not configured or the lookup fails, so callers
 * can fall back to whatever text they already have.
 */
export async function fetchVerse(reference: string): Promise<Verse | null> {
  const apiKey = process.env.BIBLE_API_KEY;
  const ref = reference?.trim();
  if (!apiKey || !ref) return null;

  const bibleId = process.env.BIBLE_ID || DEFAULT_BIBLE_ID;
  const translation = process.env.BIBLE_NAME || "KJV";
  const url = `${API_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(
    ref
  )}&limit=1&sort=relevance`;

  try {
    const res = await fetch(url, {
      headers: { "api-key": apiKey },
      // Verses are immutable — cache aggressively at the edge.
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: {
        passages?: { reference?: string; content?: string }[];
        verses?: { reference?: string; text?: string }[];
      };
    };

    const passage = json.data?.passages?.[0];
    if (passage?.content) {
      const text = stripHtml(passage.content);
      if (text) return { reference: passage.reference || ref, text, translation };
    }

    const verse = json.data?.verses?.[0];
    if (verse?.text) {
      const text = stripHtml(verse.text);
      if (text) return { reference: verse.reference || ref, text, translation };
    }

    return null;
  } catch {
    return null;
  }
}
