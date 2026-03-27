import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Flame, Mic2, ScrollText, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PRACTICE_PRESETS } from "@/lib/prompts";
import { formatDate, getModeLabel, getStreakHeatmap } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const [user, practices] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.practiceSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
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
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">Day streak</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600"><Flame className="size-5" /></div>
                  <div>
                    <p className="text-3xl font-semibold">{user.streak}</p>
                    <p className="text-xs text-zinc-500">ngày liên tiếp</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm">
                <p className="font-medium text-zinc-700">Nhiệm vụ hôm nay</p>
                <p className="mt-1 text-zinc-500">Ghi âm 25 câu trả lời nhé :)</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-2 sm:grid-cols-14">
              {heatmap.map((item) => {
                const level = item.count >= 4 ? "bg-emerald-500" : item.count >= 2 ? "bg-emerald-300" : item.count >= 1 ? "bg-emerald-100" : "bg-zinc-100";
                return <div key={item.date} title={`${item.date}: ${item.count} sessions`} className={`aspect-square rounded-md ${level}`} />;
              })}
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-zinc-500">Cách #Luyennói</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-700">
              <div>
                <p className="font-semibold text-fuchsia-600">Trả lời thẳng vào trọng tâm</p>
                <p>Đúng vòng và tóm ý trước, sau đó mới nới rộng.</p>
              </div>
              <div>
                <p className="font-semibold text-cyan-600">Sửa lỗi đến tay</p>
                <p>Chỗ dễ sai ngữ pháp, từ vựng, phát âm sẽ bị bắt rõ để ôn lại.</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-zinc-500">Average overall</p>
                <p className="mt-1 text-3xl font-semibold">{avgScore}</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-3"><Activity className="size-5 text-violet-500" /><h2 className="text-xl font-semibold">Luyện theo câu</h2></div>
            <p className="mt-3 text-sm text-zinc-600">Luyện theo FORECAST, nhận sửa lỗi và đánh giá liên tục.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {PRACTICE_PRESETS.filter((item) => item.mode !== "MOCK_TEST").map((preset) => (
                <Link key={preset.mode} href={`/practice?mode=${preset.mode}`}><Button variant="outline">{preset.mode.replaceAll("_", " ")}</Button></Link>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3"><ScrollText className="size-5 text-emerald-500" /><h2 className="text-xl font-semibold">Thi thử</h2></div>
            <p className="mt-3 text-sm text-zinc-600">Trả lời một bộ câu hỏi ngẫu nhiên, cấu trúc giống bài thi thật.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/practice?mode=PART_1"><Button variant="outline">PART 1</Button></Link>
              <Link href="/practice?mode=PART_2"><Button variant="outline">PART 2</Button></Link>
              <Link href="/practice?mode=PART_3"><Button variant="outline">PART 3</Button></Link>
              <Link href="/practice?mode=MOCK_TEST"><Button>FULL TEST</Button></Link>
            </div>
          </Card>
        </section>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Lịch sử làm bài</p>
              <h2 className="mt-2 text-2xl font-semibold">Xem lại toàn bộ bài gần đây</h2>
            </div>
            <div className="flex gap-3">
              <Link href="/history"><Button variant="outline">Xem tất cả</Button></Link>
              <Link href="/practice"><Button><Mic2 className="mr-2 size-4" />Ghi âm ngay</Button></Link>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {practices.slice(0, 10).map((item) => (
              <div key={item.id} className="rounded-3xl border border-zinc-100 bg-zinc-50/70 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{getModeLabel(item.mode)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{item.promptText}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-700">{item.overallScore}</span>
                    <span className="text-zinc-500">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
            {practices.length === 0 ? <p className="text-sm text-zinc-500">Chưa có bài nào.</p> : null}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3"><Sparkles className="size-5 text-rose-500" /><h3 className="font-semibold">Tài khoản Free / Pro</h3></div>
          <p className="mt-3 text-sm leading-7 text-zinc-600">Free hiện có <strong>30 credits</strong>. Khi thanh toán QR PayOS thành công và webhook nhận đúng event, hệ thống sẽ tự mở Pro và set credits thành <strong>9999</strong>.</p>
        </Card>
      </div>
    </AppShell>
  );
}
