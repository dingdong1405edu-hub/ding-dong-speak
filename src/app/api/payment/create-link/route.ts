import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { getPayOS } from "@/lib/payos";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/session";

const PACKAGES: Record<string, { amount: number; title: string; months: number }> = {
  "premium-1m": { amount: 100000, title: "Premium 1 month", months: 1 },
  "premium-2m": { amount: 180000, title: "Premium 2 months", months: 2 },
  "premium-3m": { amount: 250000, title: "Premium 3 months", months: 3 },
  "premium-5m": { amount: 400000, title: "Premium 5 months", months: 5 },
};

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const packageId = String(body.packageId || "premium-1m");
    const selected = PACKAGES[packageId];
    if (!selected) {
      console.error("[api/payment/create-link] Invalid packageId", { packageId, body, userId: session.user.id });
      return NextResponse.json({ error: "Package không hợp lệ" }, { status: 400 });
    }

    const orderCode = `${Date.now()}${randomInt(100, 999)}`;
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: selected.amount,
        packageId,
        durationMonths: selected.months,
        orderCode,
        status: "PENDING",
      },
    });

    const payos = getPayOS();
    const paymentLink = await payos.paymentRequests.create({
      orderCode: Number(orderCode),
      amount: selected.amount,
      description: selected.title.slice(0, 25),
      cancelUrl: `${process.env.NEXTAUTH_URL}/billing?status=cancelled`,
      returnUrl: `${process.env.NEXTAUTH_URL}/billing?status=paid`,
      buyerName: session.user.name ?? "Ding Dong User",
      buyerEmail: session.user.email ?? undefined,
      items: [{ name: selected.title, quantity: 1, price: selected.amount }],
    });

    return NextResponse.json({ checkoutUrl: paymentLink.checkoutUrl, qrCode: paymentLink.qrCode, package: selected });
  } catch (error) {
    console.error("[api/payment/create-link] Failed to create payment link", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Không tạo được link thanh toán" }, { status: 500 });
  }
}
