import { redirect } from "next/navigation";
import { BillingClient } from "@/components/billing/billing-client";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function BillingPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return <BillingClient isPro={user.isPro} credits={user.credits} />;
}
