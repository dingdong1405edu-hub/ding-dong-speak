import { PracticeMode } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PracticeSelector } from "@/components/practice/practice-selector";
import { PracticeStudio } from "@/components/practice/practice-studio";
import { Card } from "@/components/ui/card";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const VALID_PARTS = [PracticeMode.PART_1, PracticeMode.PART_2, PracticeMode.PART_3] as const;

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ part?: string; topic?: string; question?: string; custom?: string }> }) {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const requestedPart = params.part as PracticeMode | undefined;
  const part = VALID_PARTS.includes(requestedPart as (typeof VALID_PARTS)[number]) ? (requestedPart as (typeof VALID_PARTS)[number]) : PracticeMode.PART_1;
  const topic = params.topic;
  const question = params.question;
  const custom = params.custom;

  const [user, topics, recent, savedVocabs] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.questionTopic.findMany({
      where: { part, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { questions: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
    prisma.practiceSession.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.savedVocabulary.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  if (!user) redirect("/login");

  const selectedTopic = topic ? topics.find((item) => item.slug === topic) : null;
  const selectedQuestion = question ? selectedTopic?.questions.find((item) => item.id === question)?.promptText ?? null : null;
  const promptText = custom ? decodeURIComponent(custom) : selectedQuestion;

  return (
    <AppShell active="/practice" credits={user.credits} isPro={user.isPro}>
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-sm font-medium text-zinc-500">Luyện theo câu</p>
          <h1 className="mt-2 text-3xl font-semibold">Chọn Part → chọn chủ đề → chọn câu hỏi</h1>
          <p className="mt-3 text-sm leading-7 text-zinc-600">Question bank được thiết kế theo hướng admin-ready: có part, topic, danh sách câu hỏi. Nếu chưa có topic hợp ý thì user có thể nhập chủ đề riêng để AI đặt câu.</p>
        </Card>

        <PracticeSelector
          part={part}
          topics={topics.map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            desc: item.desc,
            questions: item.questions.map((q) => ({ id: q.id, promptText: q.promptText })),
          }))}
        />

        {promptText ? (
          <PracticeStudio
            mode={part}
            promptText={promptText}
            title={selectedTopic?.name || "AI Generated Topic"}
            credits={user.credits}
            isPro={user.isPro}
            savedWords={savedVocabs.map((item) => item.phrase)}
            recentSessions={recent.map((item) => ({
              id: item.id,
              promptText: item.promptText,
              transcript: item.transcript,
              overallScore: item.overallScore,
              fluency: item.fluency,
              lexical: item.lexical,
              grammar: item.grammar,
              pronunciation: item.pronunciation,
              feedbackJson: item.feedbackJson,
              createdAt: item.createdAt.toISOString(),
            }))}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
