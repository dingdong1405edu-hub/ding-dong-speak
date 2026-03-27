import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { getAuthSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, getModeLabel } from "@/lib/utils";

export default async function ReviewPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/login");

  const [user, words] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.savedVocabulary.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!user) redirect("/login");

  return (
    <AppShell active="/review" credits={user.credits} isPro={user.isPro}>
      <Card className="p-6">
        <p className="text-sm font-medium text-zinc-500">Ôn tập</p>
        <h1 className="mt-2 text-3xl font-semibold">Từ vựng đã lưu</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {words.length === 0 ? <p className="text-sm text-zinc-500">Chưa có từ nào được lưu từ trang luyện tập.</p> : words.map((word) => (
            <div key={word.id} className="rounded-3xl border border-zinc-100 p-5">
              <p className="text-lg font-semibold">{word.phrase}</p>
              <p className="mt-2 text-sm text-zinc-500">{word.mode ? getModeLabel(word.mode) : "Không rõ mode"}</p>
              {word.source ? <p className="mt-2 text-sm leading-7 text-zinc-600">{word.source}</p> : null}
              <p className="mt-4 text-xs text-zinc-400">Lưu lúc {formatDate(word.createdAt)}</p>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
