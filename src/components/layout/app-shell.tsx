import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Crown, History, Home, Mic2, NotebookPen, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Trang chủ", icon: Home },
  { href: "/practice", label: "Luyện theo câu", icon: Mic2 },
  { href: "/mock-test", label: "Thi thử", icon: ScrollText },
  { href: "/history", label: "Lịch sử", icon: History },
  { href: "/review", label: "Ôn tập", icon: NotebookPen },
  { href: "/billing", label: "Mua Xịn", icon: Crown },
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
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 px-2 pb-4">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"><BookOpen className="size-5" /></div>
            <div>
              <p className="font-semibold">Luyện Nói</p>
              <p className="text-xs text-zinc-500">IELTS Speaking AI</p>
            </div>
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    active === item.href ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-50",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </Card>

        <Card className="p-5 text-center">
          <div className="mx-auto flex size-28 items-center justify-center rounded-full border-8 border-zinc-100 bg-white text-3xl font-semibold text-violet-600 shadow-inner">
            {isPro ? "∞" : credits}
          </div>
          <p className="mt-3 text-sm text-zinc-500">{isPro ? "Pro đang mở toàn bộ tính năng" : `${credits}/30 credits free`}</p>
          <Link href="/billing" className="mt-4 block"><Button className="w-full">Mua Xịn</Button></Link>
        </Card>
      </aside>

      <div>{children}</div>
    </div>
  );
}
