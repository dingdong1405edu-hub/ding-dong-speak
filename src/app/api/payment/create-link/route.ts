import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { getPayOS } from "@/lib/payos";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/session";

const PACKAGES: Record<string, { amount: number; title: string }> = {
  "pro-100k": { amount: 100000, title: "Ding Dong Speak Pro 100k" },
  "pro-180k": { amount: 180000, title: "Ding Dong Speak Pro 180k" },
  "pro-250k": { amount: 250000, title: "Ding Dong Speak Pro 250k" },
};

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const packageId = String(body.packageId || "pro-100k");
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
      items: [
        {
          name: selected.title,
          quantity: 1,
          price: selected.amount,
        },
      ],
    });

    return NextResponse.json({ checkoutUrl: paymentLink.checkoutUrl, qrCode: paymentLink.qrCode });
  } catch (error) {
    console.error("[api/payment/create-link] Failed to create payment link", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Không tạo được link thanh toán" }, { status: 500 });
  }
}
