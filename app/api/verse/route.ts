import { NextRequest, NextResponse } from "next/server";
import { fetchVerse } from "@/lib/bible";
import { REASSURING_REFERENCES, pickReassuringReference } from "@/lib/reassurance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ref = searchParams.get("ref")?.trim();

  if (ref) {
    const verse = await fetchVerse(ref);
    if (verse) return NextResponse.json({ verse });
    return NextResponse.json(
      { error: "Couldn't reach the verse right now." },
      { status: 502 }
    );
  }

  const exclude = searchParams.get("exclude")?.trim() || undefined;
  const seedParam = Number(searchParams.get("seed"));
  const seed = Number.isFinite(seedParam) ? seedParam : Date.now();

  const first = pickReassuringReference(seed, exclude);
  const order = [first, ...REASSURING_REFERENCES.filter((r) => r !== first)];
  for (const candidate of order) {
    const verse = await fetchVerse(candidate);
    if (verse) return NextResponse.json({ verse });
  }

  return NextResponse.json(
    { error: "Couldn't reach a verse right now." },
    { status: 502 }
  );
}
