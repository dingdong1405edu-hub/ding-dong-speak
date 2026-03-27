import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPromptByMode } from "@/lib/prompts";
import { PracticeStudio } from "@/components/practice/practice-studio";

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const { mode = "PART_1" } = await searchParams;
  const preset = getPromptByMode(mode);
  const [user, recent, savedVocabs] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.practiceSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.savedVocabulary.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  if (!user) redirect("/login");

  return (
    <AppShell active="/practice" credits={user.credits} isPro={user.isPro}>
      <PracticeStudio
        mode={preset.mode}
        promptText={preset.promptText}
        title={preset.title}
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
    </AppShell>
  );
}
