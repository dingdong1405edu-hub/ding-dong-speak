import { NextResponse } from "next/server";
import { getPayOS } from "@/lib/payos";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return NextResponse.json({ success: true, message: "PayOS webhook is alive" }, { status: 200 });
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
    const payos = getPayOS();
    const webhookData = await payos.webhooks.verify(body as Parameters<typeof payos.webhooks.verify>[0]);
    const orderCode = String(webhookData.orderCode || "");
    const code = String((webhookData as { code?: string | number }).code || "");
    const desc = String((webhookData as { desc?: string }).desc || "");

    if (!orderCode) {
      console.error("[api/payment/webhook] Missing orderCode after verify", { webhookData, body });
      return NextResponse.json({ success: true, ignored: true, reason: "missing_order_code" }, { status: 200 });
    }

    const transaction = await prisma.transaction.findUnique({ where: { orderCode } });
    if (!transaction) {
      console.error("[api/payment/webhook] Transaction not found", { orderCode, code, desc, webhookData, body });
      return NextResponse.json({ success: true, ignored: true, reason: "transaction_not_found" }, { status: 200 });
    }

    const paid = code === "00" || desc.toUpperCase().includes("SUCCESS") || desc.toUpperCase().includes("THANH CONG");

    if (!paid) {
      console.error("[api/payment/webhook] Non-success payment event", { orderCode, code, desc, webhookData, body });
      return NextResponse.json({ success: true, ignored: true, reason: "non_success_event" }, { status: 200 });
    }

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

    return NextResponse.json({ success: true, userId: transaction.userId, orderCode }, { status: 200 });
  } catch (error) {
    console.error("[api/payment/webhook] Webhook handling failed", {
      body,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ success: true, ignored: true, reason: "verification_failed" }, { status: 200 });
  }
}
