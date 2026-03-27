import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPromptByMode } from "@/lib/prompts";
import { PracticeStudio } from "@/components/practice/practice-studio";

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const { mode = "PART_1" } = await searchParams;
  const preset = getPromptByMode(mode);
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const recent = await prisma.practiceSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="space-y-6" id="practice-export-root">
      <Card className="border-none bg-gradient-to-r from-rose-50 to-amber-50 p-6 text-sm leading-7 text-zinc-700">
        Nhấn <strong>Ghi âm ngay</strong>, hệ thống sẽ gửi audio qua Deepgram để lấy transcript, sau đó Groq chấm theo JSON cứng: overall, fluency, lexical, grammar, pronunciation, transcript corrections, sample answer và topic vocab.
      </Card>

      <PracticeStudio
        mode={preset.mode}
        promptText={preset.promptText}
        title={preset.title}
        credits={user.credits}
        isPro={user.isPro}
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
    </div>
  );
}
