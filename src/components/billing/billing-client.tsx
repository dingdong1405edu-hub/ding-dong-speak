"use client";

import { useState } from "react";
import { Crown, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PACKAGES = [
  { id: "pro-100k", amount: 100000, title: "Gói 100k", note: "Nạp nhanh để mở khóa Pro." },
  { id: "pro-180k", amount: 180000, title: "Gói 180k", note: "Giá đẹp cho người đang luyện đều." },
  { id: "pro-250k", amount: 250000, title: "Gói 250k", note: "Mạnh tay một lần, khỏi nghĩ credits." },
];

export function BillingClient({ isPro, credits }: { isPro: boolean; credits: number }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(packId: string) {
    setLoading(packId);
    setError(null);
    try {
      const res = await fetch("/api/payment/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: packId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tạo được link thanh toán");
      window.open(data.checkoutUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo thanh toán");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-rose-50 to-amber-50 p-6">
        <div className="flex items-center gap-3"><Crown className="size-5 text-amber-500" /><h1 className="text-2xl font-semibold">Mua Xịn</h1></div>
        <p className="mt-3 text-sm leading-7 text-zinc-700">Webhook PayOS sẽ tự cập nhật <code>isPro=true</code> và <code>credits=9999</code> cho đúng userId.</p>
        <p className="mt-3 text-sm text-zinc-600">Hiện tại: <strong>{isPro ? "PRO" : "FREE"}</strong> · Credits: <strong>{isPro ? 9999 : credits}</strong></p>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {PACKAGES.map((pack) => (
          <Card key={pack.id} className="p-6">
            <div className="flex items-center gap-3"><Wallet className="size-5 text-rose-500" /><p className="font-semibold">{pack.title}</p></div>
            <p className="mt-4 text-4xl font-semibold">{pack.amount.toLocaleString("vi-VN")}đ</p>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{pack.note}</p>
            <Button className="mt-6 w-full" onClick={() => void buy(pack.id)} disabled={loading !== null}>
              {loading === pack.id ? <Loader2 className="size-4 animate-spin" /> : "Thanh toán bằng PayOS"}
            </Button>
          </Card>
        ))}
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
