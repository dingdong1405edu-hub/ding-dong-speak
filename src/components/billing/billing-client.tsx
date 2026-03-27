"use client";

import { useMemo, useState } from "react";
import { Crown, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PACKAGES = [
  { id: "premium-1m", amount: 100000, title: "1 tháng Premium", months: 1 },
  { id: "premium-2m", amount: 180000, title: "2 tháng Premium", months: 2 },
  { id: "premium-3m", amount: 250000, title: "3 tháng Premium", months: 3 },
  { id: "premium-5m", amount: 400000, title: "5 tháng Premium", months: 5 },
];

export function BillingClient({ isPro, credits }: { isPro: boolean; credits: number }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(PACKAGES[0].id);

  const activePackage = useMemo(() => PACKAGES.find((pack) => pack.id === selected) ?? PACKAGES[0], [selected]);

  async function pay() {
    setLoading(selected);
    setError(null);
    try {
      const res = await fetch("/api/payment/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tạo được link thanh toán");
      setCheckoutUrl(data.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo thanh toán");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Premium</p>
            <h1 className="mt-2 text-3xl font-semibold">Mở khóa trọn bộ Speaking</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">Premium cho phép thi thử liên tục, chấm nghiêm khắc hơn, giữ lịch sử dài hạn, lưu từ vựng ôn tập, và dùng luồng luyện nói đầy đủ. Hết hạn mà chưa gia hạn thì mất Premium; nếu thanh toán tiếp thì thời gian được cộng dồn.</p>
          </div>
          <div className="rounded-3xl bg-zinc-50 px-5 py-4 text-sm">
            <p className="font-medium">Trạng thái hiện tại</p>
            <p className="mt-1 text-zinc-600">{isPro ? "Đang là Premium" : `Free · ${credits}/30 credits`}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {PACKAGES.map((pack) => (
              <button key={pack.id} type="button" onClick={() => setSelected(pack.id)} className={`rounded-3xl border p-5 text-left transition ${selected === pack.id ? "border-violet-500 bg-violet-50" : "border-zinc-200 bg-white"}`}>
                <p className="text-sm text-zinc-500">Gói {pack.months} tháng</p>
                <p className="mt-2 text-2xl font-semibold">{pack.amount.toLocaleString("vi-VN")}đ</p>
                <p className="mt-2 text-sm text-zinc-600">{pack.title}</p>
              </button>
            ))}
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-violet-500" /><p className="font-semibold">Quyền lợi Premium</p></div>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              <li>• Thi thử full flow, đủ số câu mới chấm tổng thể</li>
              <li>• Credits 9999 trong thời gian Premium</li>
              <li>• Lưu lịch sử làm bài và từ vựng để ôn tập</li>
              <li>• PDF report đẹp hơn để gửi/ôn lại</li>
              <li>• Sẵn sàng mở rộng cho admin question bank</li>
            </ul>
            <Button className="mt-5 w-full" onClick={() => void pay()} disabled={loading !== null}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <><Crown className="mr-2 size-4" />Thanh toán {activePackage.amount.toLocaleString("vi-VN")}đ</>}
            </Button>
            {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3"><Sparkles className="size-5 text-cyan-500" /><p className="font-semibold">Thanh toán ngay trong web</p></div>
          <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50">
            {checkoutUrl ? (
              <iframe title="PayOS checkout" src={checkoutUrl} className="h-[720px] w-full" />
            ) : (
              <div className="flex h-[720px] items-center justify-center px-8 text-center text-sm leading-7 text-zinc-500">
                Chọn gói ở bên trái rồi bấm thanh toán, khung PayOS sẽ mở ngay tại đây để user không bị bật sang trang khác.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
