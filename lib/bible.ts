const API_BASE = "https://api.scripture.api.bible/v1";
const DEFAULT_BIBLE_ID = "de4e12af7f28f599-02";

export type Verse = { reference: string; text: string; translation: string };

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

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
