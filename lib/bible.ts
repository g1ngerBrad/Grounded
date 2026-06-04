const API_BASE = process.env.BIBLE_API_BASE || "https://api.scripture.api.bible/v1";

export type Verse = { reference: string; text: string; translation: string };

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

const stripHtml = (html: string) =>
  collapse(
    html
      .replace(/<span[^>]*class="[^"]*\bv\b[^"]*"[^>]*>.*?<\/span>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\[\d+\]/g, "")
  );

function translationLabel() {
  return process.env.BIBLE_ABBREVIATION || "NIV";
}

const BOOK_CODES: Record<string, string> = {
  genesis: "GEN", exodus: "EXO", leviticus: "LEV", numbers: "NUM",
  deuteronomy: "DEU", joshua: "JOS", judges: "JDG", ruth: "RUT",
  "1samuel": "1SA", "2samuel": "2SA", "1kings": "1KI", "2kings": "2KI",
  "1chronicles": "1CH", "2chronicles": "2CH", ezra: "EZR", nehemiah: "NEH",
  esther: "EST", job: "JOB", psalm: "PSA", psalms: "PSA", proverbs: "PRO",
  ecclesiastes: "ECC", songofsongs: "SNG", songofsolomon: "SNG", isaiah: "ISA",
  jeremiah: "JER", lamentations: "LAM", ezekiel: "EZK", daniel: "DAN",
  hosea: "HOS", joel: "JOL", amos: "AMO", obadiah: "OBA", jonah: "JON",
  micah: "MIC", nahum: "NAM", habakkuk: "HAB", zephaniah: "ZEP", haggai: "HAG",
  zechariah: "ZEC", malachi: "MAL", matthew: "MAT", mark: "MRK", luke: "LUK",
  john: "JHN", acts: "ACT", romans: "ROM", "1corinthians": "1CO",
  "2corinthians": "2CO", galatians: "GAL", ephesians: "EPH", philippians: "PHP",
  colossians: "COL", "1thessalonians": "1TH", "2thessalonians": "2TH",
  "1timothy": "1TI", "2timothy": "2TI", titus: "TIT", philemon: "PHM",
  hebrews: "HEB", james: "JAS", "1peter": "1PE", "2peter": "2PE",
  "1john": "1JN", "2john": "2JN", "3john": "3JN", jude: "JUD",
  revelation: "REV", revelations: "REV",
  
  ps: "PSA", phil: "PHP", rom: "ROM", matt: "MAT", mt: "MAT", jn: "JHN",
  gen: "GEN", deut: "DEU", isa: "ISA", jer: "JER", prov: "PRO", eccl: "ECC",
  cor: "1CO", thess: "1TH", tim: "1TI", heb: "HEB", jas: "JAS", rev: "REV",
};

function bookCode(raw: string): string | null {
  const key = raw
    .toLowerCase()
    .replace(/\bfirst\b/g, "1")
    .replace(/\bsecond\b/g, "2")
    .replace(/\bthird\b/g, "3")
    .replace(/[.\s]/g, "");
  if (BOOK_CODES[key]) return BOOK_CODES[key];
  if (key.endsWith("s") && BOOK_CODES[key.slice(0, -1)]) return BOOK_CODES[key.slice(0, -1)];
  return null;
}

function toPassageId(reference: string): string | null {
  const m = reference
    .trim()
    .match(/^([1-3]?\s*[A-Za-z.]+(?:\s+of\s+[A-Za-z.]+)?)\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?/);
  if (!m) return null;
  const code = bookCode(m[1]);
  if (!code) return null;
  const [, , chapter, start, end] = m;
  const base = `${code}.${chapter}.${start}`;
  return end ? `${base}-${code}.${chapter}.${end}` : base;
}

let resolvedId: string | null = null;
let resolving: Promise<string | null> | null = null;

async function resolveBibleId(apiKey: string): Promise<string | null> {
  if (process.env.BIBLE_ID?.trim()) return process.env.BIBLE_ID.trim();
  if (resolvedId) return resolvedId;
  if (resolving) return resolving;

  const wanted = translationLabel().toLowerCase();
  resolving = (async () => {
    try {
      const res = await fetch(`${API_BASE}/bibles`, {
        headers: { "api-key": apiKey },
        next: { revalidate: 60 * 60 * 24 },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        data?: { id: string; abbreviation?: string; abbreviationLocal?: string }[];
      };
      const match = json.data?.find(
        (b) =>
          b.abbreviation?.toLowerCase().startsWith(wanted) ||
          b.abbreviationLocal?.toLowerCase().startsWith(wanted)
      );
      resolvedId = match?.id ?? null;
      return resolvedId;
    } catch {
      return null;
    } finally {
      resolving = null;
    }
  })();
  return resolving;
}

async function fetchPassage(
  bibleId: string,
  apiKey: string,
  passageId: string,
  translation: string
): Promise<Verse | null> {
  const params = new URLSearchParams({
    "content-type": "text",
    "include-verse-numbers": "false",
    "include-chapter-numbers": "false",
    "include-notes": "false",
    "include-titles": "false",
  });
  const url = `${API_BASE}/bibles/${bibleId}/passages/${passageId}?${params}`;
  try {
    const res = await fetch(url, {
      headers: { "api-key": apiKey },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { reference?: string; content?: string };
    };
    const reference = json.data?.reference || passageId;
    let text = collapse(json.data?.content || "");
    const heading = reference.split(":")[0]?.trim();
    if (heading && text.startsWith(heading)) {
      text = text.slice(heading.length).trim();
    }
    if (text) return { reference, text, translation };
    return null;
  } catch {
    return null;
  }
}

async function searchVerse(
  bibleId: string,
  apiKey: string,
  ref: string,
  translation: string
): Promise<Verse | null> {
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

export async function fetchVerse(reference: string): Promise<Verse | null> {
  const apiKey = process.env.BIBLE_API_KEY;
  const ref = reference?.trim();
  if (!apiKey || !ref) return null;

  const bibleId = await resolveBibleId(apiKey);
  if (!bibleId) return null;

  const translation = translationLabel();
  const passageId = toPassageId(ref);
  if (passageId) {
    const verse = await fetchPassage(bibleId, apiKey, passageId, translation);
    if (verse) return verse;
  }
  return searchVerse(bibleId, apiKey, ref, translation);
}
