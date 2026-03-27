import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, getModeLabel } from "@/lib/utils";

export default async function HistoryPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const [user, practices] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.practiceSession.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!user) redirect("/login");

  return (
    <AppShell active="/history" credits={user.credits} isPro={user.isPro}>
      <Card className="p-6">
        <p className="text-sm font-medium text-zinc-500">Toàn bộ lịch sử</p>
        <h1 className="mt-2 text-3xl font-semibold">Các bài đã làm</h1>
        <div className="mt-6 space-y-4">
          {practices.length === 0 ? <p className="text-sm text-zinc-500">Chưa có bài nào.</p> : practices.map((item) => {
            const feedback = item.feedbackJson as { sample_answer?: string; topic_vocab?: string[]; notes?: string[] };
            return (
              <div key={item.id} className="rounded-3xl border border-zinc-100 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold">{getModeLabel(item.mode)}</p>
                    <p className="mt-1 text-sm text-zinc-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-yellow-100 px-3 py-1">Overall {item.overallScore}</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1">Fluency {item.fluency}</span>
                    <span className="rounded-full bg-sky-100 px-3 py-1">Lexical {item.lexical}</span>
                    <span className="rounded-full bg-fuchsia-100 px-3 py-1">Grammar {item.grammar}</span>
                    <span className="rounded-full bg-orange-100 px-3 py-1">Pronunciation {item.pronunciation}</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm font-medium text-zinc-500">Đề bài</p>
                    <p className="mt-2 text-sm leading-7">{item.promptText}</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm font-medium text-zinc-500">Transcript</p>
                    <p className="mt-2 text-sm leading-7">{item.transcript}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-700">Câu mẫu</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{feedback.sample_answer || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 p-4">
                    <p className="text-sm font-medium text-violet-700">Từ vựng chủ đề</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(feedback.topic_vocab || []).map((word) => <span key={`${item.id}-${word}`} className="rounded-full bg-white px-3 py-1 text-sm">{word}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}
