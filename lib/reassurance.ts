export const REASSURING_REFERENCES = [
  "Matthew 6:34",
  "Philippians 4:6-7",
  "Isaiah 41:10",
  "Psalm 23:4",
  "John 14:27",
  "Psalm 46:1",
  "Joshua 1:9",
  "1 Peter 5:7",
  "Psalm 34:18",
  "Matthew 11:28",
  "Psalm 55:22",
  "2 Timothy 1:7",
  "Lamentations 3:22-23",
  "Romans 8:38-39",
  "Psalm 121:1-2",
  "Deuteronomy 31:6",
  "Psalm 94:19",
  "Isaiah 26:3",
  "Proverbs 3:5-6",
  "Psalm 27:1",
] as const;

export function pickReassuringReference(seed: number, exclude?: string): string {
  const pool = exclude
    ? REASSURING_REFERENCES.filter((r) => r !== exclude)
    : REASSURING_REFERENCES;
  const list = pool.length ? pool : REASSURING_REFERENCES;
  const idx = Math.abs(Math.trunc(seed)) % list.length;
  return list[idx];
}
