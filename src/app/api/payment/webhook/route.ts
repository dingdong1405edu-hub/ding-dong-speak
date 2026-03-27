import { NextResponse } from "next/server";
import { getPayOS } from "@/lib/payos";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payos = getPayOS();
    const webhookData = await payos.webhooks.verify(body);
    const orderCode = String(webhookData.orderCode);

    const transaction = await prisma.transaction.findUnique({ where: { orderCode } });
    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "PAID" },
      }),
      prisma.user.update({
        where: { id: transaction.userId },
        data: {
          isPro: true,
          credits: 9999,
        },
      }),
    ]);

    return NextResponse.json({ success: true, userId: transaction.userId });
  } catch {
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
