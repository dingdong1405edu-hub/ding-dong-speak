"use client";

import { useState } from "react";
import Link from "next/link";
import { Wand2 } from "lucide-react";
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

  async function generate() {
    if (!idea.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part, topic: idea.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tạo được câu hỏi");
      setGenerated(data.questions || []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {(["PART_1", "PART_2", "PART_3"] as const).map((item) => (
          <Link key={item} href={`/practice?part=${item}`}><Button variant={part === item ? "default" : "outline"}>{item.replaceAll("_", " ")}</Button></Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {topics.map((topic) => (
          <Card key={topic.id} className="p-5">
            <p className="text-sm text-zinc-500">{part.replaceAll("_", " ")}</p>
            <h3 className="mt-2 text-xl font-semibold">{topic.name}</h3>
            <p className="mt-2 text-sm text-zinc-600">{topic.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topic.questions.map((question) => (
                <Link key={question.id} href={`/practice?part=${part}&topic=${topic.slug}&question=${question.id}`}><Button variant="outline" size="sm">{question.promptText.slice(0, 44)}...</Button></Link>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3"><Wand2 className="size-5 text-violet-500" /><h3 className="font-semibold">AI ra câu theo chủ đề anh yêu cầu</h3></div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="VD: shopping habits, music, public transport..." className="h-11 flex-1 rounded-2xl border border-zinc-200 px-4" />
          <Button onClick={() => void generate()} disabled={busy}>{busy ? "Đang tạo..." : "Tạo câu hỏi"}</Button>
        </div>
        {generated.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {generated.map((question, index) => <Link key={`${question}-${index}`} href={`/practice?part=${part}&custom=${encodeURIComponent(question)}`}><Button variant="outline" size="sm">{question}</Button></Link>)}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
