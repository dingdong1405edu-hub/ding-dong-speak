import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Flame, Mic2, ScrollText, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, getModeLabel, getStreakHeatmap } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const [user, practices] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.practiceSession.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  if (!user) redirect("/login");

  const dayBuckets = new Map<string, number>();
  for (const item of practices) {
    const key = item.createdAt.toISOString().slice(0, 10);
    dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }

  const heatmap = getStreakHeatmap(Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count })));
  const avgScore = practices.length ? (practices.reduce((sum, item) => sum + item.overallScore, 0) / practices.length).toFixed(1) : "0.0";

  return (
    <AppShell active="/dashboard" credits={user.credits} isPro={user.isPro}>
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-0 bg-[linear-gradient(135deg,#f5f3ff_0%,#eef2ff_45%,#ecfeff_100%)] p-6 shadow-xl shadow-violet-100/40">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Luyện nói kiểu xịn, vừa đẹp vừa gắt điểm.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">Chọn “Luyện theo câu” để tập từng chủ đề hoặc vào “Thi thử” để AI tự tạo đề giống IELTS thật rồi chấm sau khi hoàn thành đủ số câu.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-3xl bg-white/80 p-4 shadow-sm">
                  <p className="text-zinc-500">Average</p>
                  <p className="mt-1 text-3xl font-semibold text-zinc-900">{avgScore}</p>
                </div>
                <div className="rounded-3xl bg-white/80 p-4 shadow-sm">
                  <p className="text-zinc-500">Streak</p>
                  <p className="mt-1 text-3xl font-semibold text-zinc-900">{user.streak}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/practice?part=PART_1"><Button><Mic2 className="mr-2 size-4" />Luyện theo câu</Button></Link>
              <Link href="/mock-test"><Button variant="outline"><ScrollText className="mr-2 size-4" />Thi thử AI</Button></Link>
            </div>
          </Card>

          <Card className="border-0 bg-white/90 p-6 shadow-xl shadow-zinc-100/50">
            <div className="flex items-center gap-3"><Flame className="size-5 text-violet-500" /><p className="font-semibold">Day streak</p></div>
            <div className="mt-5 grid grid-cols-7 gap-2 sm:grid-cols-14">
              {heatmap.map((item) => {
                const level = item.count >= 4 ? "bg-violet-500" : item.count >= 2 ? "bg-violet-300" : item.count >= 1 ? "bg-violet-100" : "bg-zinc-100";
                return <div key={item.date} title={`${item.date}: ${item.count} sessions`} className={`aspect-square rounded-md ${level}`} />;
              })}
            </div>
            <p className="mt-3 text-sm text-zinc-500">42 ngày gần nhất. Ô càng đậm thì luyện càng đều.</p>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-0 bg-white/90 p-6 shadow-lg shadow-cyan-100/50">
            <div className="flex items-center gap-3"><Activity className="size-5 text-cyan-500" /><h2 className="text-xl font-semibold">Luyện theo câu</h2></div>
            <p className="mt-3 text-sm leading-7 text-zinc-600">Chọn part, chọn topic, chọn câu hỏi mẫu hoặc gõ chủ đề riêng để AI ra bộ câu mới.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/practice?part=PART_1"><Button variant="outline">PART 1</Button></Link>
              <Link href="/practice?part=PART_2"><Button variant="outline">PART 2</Button></Link>
              <Link href="/practice?part=PART_3"><Button variant="outline">PART 3</Button></Link>
            </div>
          </Card>

          <Card className="border-0 bg-white/90 p-6 shadow-lg shadow-emerald-100/50">
            <div className="flex items-center gap-3"><ScrollText className="size-5 text-emerald-500" /><h2 className="text-xl font-semibold">Thi thử</h2></div>
            <p className="mt-3 text-sm leading-7 text-zinc-600">Chọn part, số câu, giọng examiner. AI tự tạo đề, user trả lời liên tục đủ số câu rồi mới chấm điểm tổng thể.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/mock-test"><Button>Vào thi thử</Button></Link>
            </div>
          </Card>
        </section>

        <Card className="border-0 bg-white/90 p-6 shadow-xl shadow-zinc-100/50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Lịch sử làm bài</p>
              <h2 className="mt-2 text-2xl font-semibold">Bài gần đây của anh</h2>
            </div>
            <Link href="/history"><Button variant="outline">Xem tất cả</Button></Link>
          </div>
          <div className="mt-5 space-y-3">
            {practices.length === 0 ? <p className="text-sm text-zinc-500">Chưa có bài nào.</p> : practices.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-3xl border border-zinc-100 bg-zinc-50/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-zinc-900">{getModeLabel(item.mode)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{item.promptText}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-700">{item.overallScore}</span>
                    <span className="text-zinc-500">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-0 bg-[linear-gradient(135deg,#fff1f2_0%,#fdf2f8_45%,#faf5ff_100%)] p-6 shadow-lg shadow-rose-100/40">
          <div className="flex items-center gap-3"><Sparkles className="size-5 text-rose-500" /><h3 className="font-semibold">Free / Premium</h3></div>
          <p className="mt-3 text-sm leading-7 text-zinc-600">Free có <strong>30 credits</strong>. Premium cho thi thử liên tục, credits gần như không giới hạn trong thời gian còn hạn, cộng dồn theo gói 1 / 2 / 3 / 5 tháng.</p>
        </Card>
      </div>
    </AppShell>
  );
}
