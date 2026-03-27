import { redirect } from "next/navigation";
import { BillingClient } from "@/components/billing/billing-client";
import { AppShell } from "@/components/layout/app-shell";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function BillingPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <AppShell active="/billing" credits={user.credits} isPro={user.isPro}>
      <BillingClient isPro={user.isPro} credits={user.credits} />
    </AppShell>
  );
}
