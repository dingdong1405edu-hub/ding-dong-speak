import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Crown, History, Home, Mic2, NotebookPen, ScrollText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Trang chủ", icon: Home, accent: "from-fuchsia-500 to-violet-500" },
  { href: "/practice", label: "Luyện theo câu", icon: Mic2, accent: "from-cyan-500 to-blue-500" },
  { href: "/mock-test", label: "Thi thử", icon: ScrollText, accent: "from-emerald-500 to-teal-500" },
  { href: "/history", label: "Lịch sử", icon: History, accent: "from-amber-500 to-orange-500" },
  { href: "/review", label: "Ôn tập", icon: NotebookPen, accent: "from-rose-500 to-pink-500" },
  { href: "/billing", label: "Premium", icon: Crown, accent: "from-violet-500 to-indigo-500" },
];

export function AppShell({
  active,
  credits,
  isPro,
  children,
}: {
  active: string;
  credits: number;
  isPro: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 lg:space-y-0">
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="overflow-hidden border-0 bg-white/85 shadow-xl shadow-violet-100/40 backdrop-blur">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.14),transparent_35%)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-300/30">
                <BookOpen className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Ding Dong Speak</p>
                <p className="text-xs text-zinc-500">IELTS Speaking AI Lab</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-zinc-500">Gói hiện tại</p>
                <p className="mt-1 font-semibold text-zinc-900">{isPro ? "Premium" : "Free"}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <p className="text-zinc-500">Credits</p>
                <p className="mt-1 font-semibold text-zinc-900">{isPro ? "∞" : `${credits}/30`}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 p-4">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm",
                      active === item.href ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <nav className="hidden space-y-2 lg:block">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-4 py-3 transition",
                      active === item.href ? "bg-zinc-900 text-white shadow-lg shadow-zinc-300/30" : "text-zinc-600 hover:bg-zinc-50",
                    )}
                  >
                    <span className={cn("flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white", item.accent)}>
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className={cn("text-xs", active === item.href ? "text-zinc-300" : "text-zinc-400")}>Mở nhanh</p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </Card>

        <Card className="border-0 bg-[linear-gradient(135deg,#0f172a_0%,#312e81_45%,#6d28d9_100%)] p-5 text-white shadow-xl shadow-indigo-200/40">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5" />
            <p className="font-semibold">Boost Speaking</p>
          </div>
          <p className="mt-3 text-sm leading-7 text-white/80">Mock test liên tục, lưu từ vựng ôn tập, xuất PDF đẹp, và mở rộng question bank theo từng part.</p>
          <Link href="/billing" className="mt-4 block"><Button className="w-full bg-white text-zinc-900 hover:bg-white/90">Mua Premium</Button></Link>
        </Card>
      </div>

      <div>{children}</div>
    </div>
  );
}
