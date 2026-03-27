import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MockTestClient } from "@/components/mock/mock-test-client";
import { Card } from "@/components/ui/card";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function MockTestPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const [user, topics] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.questionTopic.findMany({
      where: { isActive: true },
      orderBy: [{ part: "asc" }, { sortOrder: "asc" }],
      include: { questions: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  if (!user) redirect("/login");

  return (
    <AppShell active="/mock-test" credits={user.credits} isPro={user.isPro}>
      <div className="space-y-6">
        <Card className="border-0 bg-[linear-gradient(135deg,#ecfeff_0%,#eff6ff_48%,#f5f3ff_100%)] p-6 shadow-xl shadow-cyan-100/40">
          <p className="text-sm font-medium text-zinc-500">Thi thử AI</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">AI tự tạo đề thi giống IELTS thật rồi chấm sau khi anh hoàn thành đủ câu.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">Chọn part, số câu và giọng examiner. Anh có thể nghe thử giọng trước. Khi đã vào bài, cứ trả lời lần lượt, đến câu cuối AI mới chấm điểm tổng thể.</p>
        </Card>

        <MockTestClient topics={topics.map((topic) => ({ part: topic.part, name: topic.name, questions: topic.questions.map((q) => q.promptText) }))} />
      </div>
    </AppShell>
  );
}
