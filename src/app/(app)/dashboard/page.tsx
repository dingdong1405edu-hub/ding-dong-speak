import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, Flame, Mic2, Wallet } from "lucide-react";
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
      take: 12,
    }),
  ]);

  if (!user) redirect("/login");

  const dayBuckets = new Map<string, number>();
  for (const item of practices) {
    const key = item.createdAt.toISOString().slice(0, 10);
    dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }

  const heatmap = getStreakHeatmap(Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count })));
  const avgScore = practices.length
    ? (practices.reduce((sum, item) => sum + item.overallScore, 0) / practices.length).toFixed(1)
    : "0.0";

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Navigation</p>
          <div className="mt-4 space-y-2 text-sm">
            <Link href="/dashboard" className="block rounded-2xl bg-zinc-900 px-4 py-3 text-white">Tổng quan</Link>
            <Link href="/practice" className="block rounded-2xl px-4 py-3 text-zinc-700 hover:bg-zinc-100">Luyện tập</Link>
            <Link href="/billing" className="block rounded-2xl px-4 py-3 text-zinc-700 hover:bg-zinc-100">Mua Xịn</Link>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-rose-50 p-5">
          <div className="flex items-center gap-3"><Crown className="size-5 text-amber-500" /><p className="font-semibold">Trạng thái VIP</p></div>
          <p className="mt-3 text-3xl font-semibold">{user.isPro ? "PRO" : "FREE"}</p>
          <p className="mt-2 text-sm text-zinc-600">{user.isPro ? "Không giới hạn credits, full tính năng." : `${user.credits} credits còn lại.`}</p>
          <Link href="/billing" className="mt-4 inline-flex"><Button>Mua Xịn</Button></Link>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3"><Flame className="size-5 text-rose-500" /><p className="font-semibold">Tiến độ</p></div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-zinc-50 p-4"><p className="text-zinc-500">Streak</p><p className="mt-1 text-2xl font-semibold">{user.streak}</p></div>
            <div className="rounded-2xl bg-zinc-50 p-4"><p className="text-zinc-500">Avg Overall</p><p className="mt-1 text-2xl font-semibold">{avgScore}</p></div>
          </div>
        </Card>
      </aside>

      <div className="space-y-6">
        <Card className="p-6 sm:p-7">
          <p className="text-sm uppercase tracking-[0.3em] text-rose-500">Day streak</p>
          <div className="mt-5 grid grid-cols-7 gap-2 sm:grid-cols-14">
            {heatmap.map((item) => {
              const level = item.count >= 4 ? "bg-emerald-500" : item.count >= 2 ? "bg-emerald-300" : item.count >= 1 ? "bg-emerald-100" : "bg-zinc-100";
              return <div key={item.date} title={`${item.date}: ${item.count} sessions`} className={`aspect-square rounded-md ${level}`} />;
            })}
          </div>
          <p className="mt-3 text-sm text-zinc-500">42 ngày gần nhất — ô càng đậm nghĩa là luyện càng nhiều.</p>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PRACTICE_PRESETS.map((preset) => (
            <Card key={preset.mode} className="p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{preset.mode.replaceAll("_", " ")}</p>
              <h2 className="mt-2 text-xl font-semibold">{preset.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{preset.description}</p>
              <Link href={`/practice?mode=${preset.mode}`} className="mt-5 inline-flex"><Button variant="outline">Bắt đầu</Button></Link>
            </Card>
          ))}
        </section>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Practice history</p>
              <h2 className="mt-2 text-2xl font-semibold">Các lượt luyện gần đây</h2>
            </div>
            <Link href="/practice"><Button><Mic2 className="mr-2 size-4" />Ghi âm ngay</Button></Link>
          </div>
          <div className="mt-5 space-y-3">
            {practices.length === 0 ? (
              <p className="text-sm text-zinc-500">Chưa có lượt luyện nào. Bấm “Ghi âm ngay” để tạo phiên đầu tiên.</p>
            ) : practices.map((item) => (
              <div key={item.id} className="rounded-2xl border border-zinc-100 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{getModeLabel(item.mode)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{item.promptText}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-600">Overall {item.overallScore}</span>
                    <span className="text-zinc-500">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3"><Wallet className="size-5 text-rose-500" /><h3 className="font-semibold">Tài khoản</h3></div>
          <p className="mt-3 text-sm leading-7 text-zinc-600">Hiện tại hệ thống chỉ hỗ trợ đăng nhập Google qua NextAuth + PrismaAdapter. Không còn form thủ công Tên / Email / Password.</p>
        </Card>
      </div>
    </div>
  );
}
