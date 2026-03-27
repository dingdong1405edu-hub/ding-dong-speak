import { NextResponse } from "next/server";
import { PracticeMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/session";

const VALID_MODES = new Set(Object.values(PracticeMode));

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const phrase = String(body.phrase || "").trim();
    const source = String(body.source || "").trim();
    const rawMode = String(body.mode || "").trim();
    const mode = VALID_MODES.has(rawMode as PracticeMode) ? (rawMode as PracticeMode) : null;

    if (!phrase) {
      return NextResponse.json({ error: "phrase is required" }, { status: 400 });
    }

    const saved = await prisma.savedVocabulary.upsert({
      where: {
        userId_phrase: {
          userId: session.user.id,
          phrase,
        },
      },
      update: { source: source || undefined, mode: mode || undefined },
      create: {
        userId: session.user.id,
        phrase,
        source: source || null,
        mode,
      },
    });

    return NextResponse.json({ success: true, saved });
  } catch (error) {
    console.error("[api/vocab/save] Failed to save vocabulary", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Không lưu được từ vựng" }, { status: 500 });
  }
}
