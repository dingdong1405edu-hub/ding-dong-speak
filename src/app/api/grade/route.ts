import { NextResponse } from "next/server";
import { PracticeMode } from "@prisma/client";
import { gradeSpeaking } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/session";

const VALID_MODES = new Set(Object.values(PracticeMode));

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const rawMode = String(body.mode || "PART_1").trim();
    const mode = (VALID_MODES.has(rawMode as PracticeMode) ? rawMode : "PART_1") as PracticeMode;
    const promptText = String(body.promptText || "").trim();
    const transcript = String(body.transcript || "").trim();
    const audioUrl = body.audioUrl ? String(body.audioUrl).trim() : null;

    if (!promptText || !transcript) {
      console.error("[api/grade] Missing required fields", {
        userId: session.user.id,
        mode,
        body,
      });
      return NextResponse.json({ error: "promptText and transcript are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      console.error("[api/grade] User not found", { userId: session.user.id });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isPro && user.credits <= 0) {
      console.error("[api/grade] Credits exhausted", { userId: user.id, credits: user.credits, isPro: user.isPro });
      return NextResponse.json({ error: "Hết credits rồi, bấm Mua Xịn để luyện tiếp nha." }, { status: 403 });
    }

    const graded = await gradeSpeaking({ mode, promptText, transcript });

    if (!user.id || !promptText || !transcript) {
      console.error("[api/grade] Invalid create payload before PracticeSession insert", {
        userId: user.id,
        mode,
        promptText,
        transcript,
        graded,
      });
      return NextResponse.json({ error: "Invalid practice payload" }, { status: 400 });
    }

    const today = startOfDay(new Date());
    const lastDate = user.lastActiveDate ? startOfDay(user.lastActiveDate) : null;
    let nextStreak = user.streak;

    if (!lastDate) nextStreak = 1;
    else {
      const diffDays = Math.round((today.getTime() - lastDate.getTime()) / 86400000);
      if (diffDays <= 0) nextStreak = user.streak || 1;
      else if (diffDays === 1) nextStreak = (user.streak || 0) + 1;
      else nextStreak = 1;
    }

    const saved = await prisma.$transaction(async (tx) => {
      const sessionRow = await tx.practiceSession.create({
        data: {
          userId: user.id,
          mode,
          promptText,
          audioUrl: audioUrl || null,
          transcript,
          overallScore: graded.overall,
          fluency: graded.fluency,
          lexical: graded.lexical,
          grammar: graded.grammar,
          pronunciation: graded.pronunciation,
          feedbackJson: graded,
        },
      });

      if (!user.isPro) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            credits: { decrement: 1 },
            streak: nextStreak,
            lastActiveDate: new Date(),
          },
        });
      } else {
        await tx.user.update({
          where: { id: user.id },
          data: {
            streak: nextStreak,
            lastActiveDate: new Date(),
          },
        });
      }

      return sessionRow;
    });

    return NextResponse.json({ sessionId: saved.id, ...graded });
  } catch (error) {
    console.error("[api/grade] Unexpected error", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Không chấm điểm được bài nói" }, { status: 500 });
  }
}
