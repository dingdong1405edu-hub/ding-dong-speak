import { NextResponse } from "next/server";
import { Prisma, PracticeMode } from "@prisma/client";
import { gradeMockExam } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const part = String(body.part || "PART_1") as PracticeMode;
    const questions = Array.isArray(body.questions) ? body.questions.map(String).filter(Boolean) : [];
    const answers = Array.isArray(body.answers) ? body.answers.map(String).filter(Boolean) : [];
    const voice = String(body.voice || "aura-athena-en");

    if (!questions.length || !answers.length || questions.length !== answers.length) {
      return NextResponse.json({ error: "questions and answers are required in equal length" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.isPro && user.credits <= 0) return NextResponse.json({ error: "Hết credits rồi." }, { status: 403 });

    const graded = await gradeMockExam({ part, questions, answers });
    const transcript = answers.join("\n\n");
    const promptText = questions.map((item: string, index: number) => `${index + 1}. ${item}`).join("\n");

    const saved = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sessionRow = await tx.practiceSession.create({
        data: {
          userId: user.id,
          mode: PracticeMode.MOCK_TEST,
          promptText,
          transcript,
          overallScore: graded.overall,
          fluency: graded.fluency,
          lexical: graded.lexical,
          grammar: graded.grammar,
          pronunciation: graded.pronunciation,
          feedbackJson: { ...graded, voice, questionCount: questions.length, part },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: !user.isPro ? { credits: { decrement: 1 } } : {},
      });

      return sessionRow;
    });

    return NextResponse.json({ sessionId: saved.id, ...graded });
  } catch (error) {
    console.error("[api/mock/grade] Failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Không chấm được mock test" }, { status: 500 });
  }
}
