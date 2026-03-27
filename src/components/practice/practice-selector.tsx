"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Topic = {
  id: string;
  name: string;
  slug: string;
  desc: string | null;
  questions: Array<{ id: string; promptText: string }>;
};

export function PracticeSelector({
  part,
  topics,
}: {
  part: string;
  topics: Topic[];
}) {
  const [idea, setIdea] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!idea.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part, topic: idea.trim(), count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tạo được câu hỏi");
      setGenerated(data.questions || []);
    } catch (err) {
      console.error("[PracticeSelector.generate] Failed", { part, idea, error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : "Không tạo được câu hỏi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {(["PART_1", "PART_2", "PART_3"] as const).map((item) => (
          <Link key={item} href={`/practice?part=${item}`}>
            <Button variant={part === item ? "default" : "outline"} className={part === item ? "bg-zinc-900 text-white" : "bg-white"}>
              {item.replaceAll("_", " ")}
            </Button>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-0 bg-[linear-gradient(135deg,#eff6ff_0%,#f5f3ff_55%,#fdf2f8_100%)] p-5 shadow-lg shadow-fuchsia-100/40">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm"><Sparkles className="size-5" /></div>
            <div>
              <p className="text-sm text-zinc-500">Chủ đề AI</p>
              <h3 className="font-semibold text-zinc-900">Ra câu hỏi theo ý anh</h3>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="VD: social media pressure, apartment living, smartphones..." className="h-12 w-full rounded-2xl border border-white/60 bg-white/80 px-4 shadow-sm" />
            <Button className="w-full" onClick={() => void generate()} disabled={busy}>{busy ? "Đang tạo bộ câu hỏi..." : "Tạo bộ câu hỏi mới"}</Button>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
          </div>
          {generated.length ? (
            <div className="mt-5 space-y-3">
              {generated.map((question, index) => (
                <Link key={`${question}-${index}`} href={`/practice?part=${part}&custom=${encodeURIComponent(question)}`} className="flex items-center justify-between rounded-2xl bg-white/85 px-4 py-3 text-sm text-zinc-700 shadow-sm">
                  <span className="line-clamp-2">{question}</span>
                  <ChevronRight className="size-4 shrink-0 text-zinc-400" />
                </Link>
              ))}
            </div>
          ) : null}
        </Card>

        <div className="space-y-4">
          {topics.map((topic) => (
            <Card key={topic.id} className="border-0 bg-white/85 p-5 shadow-lg shadow-zinc-100/60">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-violet-500">{part.replaceAll("_", " ")}</p>
                  <h3 className="mt-2 text-xl font-semibold text-zinc-900">{topic.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{topic.desc}</p>
                </div>
                <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-center text-sm text-zinc-500">
                  <p className="font-semibold text-zinc-900">{topic.questions.length}</p>
                  <p>câu mẫu</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {topic.questions.map((question) => (
                  <Link key={question.id} href={`/practice?part=${part}&topic=${topic.slug}&question=${question.id}`} className="group rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 transition hover:border-violet-200 hover:bg-violet-50">
                    <p className="line-clamp-3 text-sm leading-7 text-zinc-700">{question.promptText}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-violet-600">
                      <span>Chọn câu này</span>
                      <ChevronRight className="size-4 transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
