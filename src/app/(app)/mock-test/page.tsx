import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MockTestClient } from "@/components/mock/mock-test-client";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function MockTestPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const [user, topics] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.questionTopic.findMany({
      where: { isActive: true },
      orderBy: [{ part: "asc" }, { sortOrder: "asc" }],
      include: { questions: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  if (!user) redirect("/login");

  return (
    <AppShell active="/mock-test" credits={user.credits} isPro={user.isPro}>
      <MockTestClient topics={topics.map((topic) => ({ part: topic.part, name: topic.name, questions: topic.questions.map((q) => q.promptText) }))} />
    </AppShell>
  );
}
