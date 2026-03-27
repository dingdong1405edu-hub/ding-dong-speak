"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Mic, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Topic = { part: string; name: string; questions: string[] };

type Grade = {
  overall: number;
  fluency: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
  sample_answer: string;
  topic_vocab: string[];
  notes?: string[];
  error?: string;
};

const VOICES = [
  { id: "aura-asteria-en", name: "Asteria" },
  { id: "aura-luna-en", name: "Luna" },
  { id: "aura-stella-en", name: "Stella" },
  { id: "aura-athena-en", name: "Athena" },
  { id: "aura-helios-en", name: "Helios" },
  { id: "aura-orpheus-en", name: "Orpheus" },
];

async function safeJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return JSON.parse(text) as T;
}

export function MockTestClient({ topics }: { topics: Topic[] }) {
  const [part, setPart] = useState("PART_1");
  const [count, setCount] = useState(3);
  const [voice, setVoice] = useState(VOICES[3].id);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Grade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = useMemo(() => questions[index] || "", [questions, index]);
  const filtered = useMemo(() => topics.filter((topic) => topic.part === part), [topics, part]);

  async function startExam() {
    try {
      setBusy(true);
      const requestedCount = Math.max(2, Math.min(9, count));
      const res = await fetch("/api/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part,
          topic: `Create a realistic IELTS ${part.replaceAll("_", " ")} mock test with ${requestedCount} strict examiner questions`,
          count: requestedCount,
        }),
      });
      const data = await safeJson<{ questions?: string[]; error?: string }>(res);
      if (!res.ok || !data.questions?.length) throw new Error(data.error || "Không tạo được đề AI");
      setQuestions(data.questions.slice(0, requestedCount));
      setAnswers([]);
      setResult(null);
      setIndex(0);
      setStarted(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được đề AI");
    } finally {
      setBusy(false);
    }
  }

  async function playQuestion() {
    if (!currentQuestion) return;
    const res = await fetch("/api/examiner/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: currentQuestion, voice }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (audioRef.current) {
      audioRef.current.src = url;
      await audioRef.current.play();
    }
  }

  async function startRecording() {
    if (!started || busy) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
    recorder.onstop = async () => {
      try {
        setBusy(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "answer.webm");
        formData.append("mode", part);
        formData.append("promptText", currentQuestion);
        const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
        const transcribeData = await safeJson<{ transcript?: string; error?: string }>(transcribeRes);
        if (!transcribeRes.ok || !transcribeData.transcript) throw new Error(transcribeData.error || "Không transcript được");

        const nextAnswers = [...answers, transcribeData.transcript];
        setAnswers(nextAnswers);

        if (index + 1 >= questions.length) {
          const gradeRes = await fetch("/api/mock/grade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ part, questions, answers: nextAnswers, voice }),
          });
          const gradeData = await safeJson<Grade>(gradeRes);
          if (!gradeRes.ok) throw new Error(gradeData.error || "Không chấm được mock test");
          setResult(gradeData);
        } else {
          setIndex((prev) => prev + 1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      } finally {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setBusy(false);
      }
    };

    recorderRef.current = recorder;
    recorder.start();
  }

  function stopRecording() {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    recorderRef.current.stop();
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <select value={part} onChange={(e) => setPart(e.target.value)} className="h-11 rounded-2xl border border-zinc-200 px-4">
            <option value="PART_1">PART 1</option>
            <option value="PART_2">PART 2</option>
            <option value="PART_3">PART 3</option>
          </select>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-11 rounded-2xl border border-zinc-200 px-4">
            {Array.from({ length: 8 }, (_, i) => i + 2).map((num) => <option key={num} value={num}>{num} câu</option>)}
          </select>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} className="h-11 rounded-2xl border border-zinc-200 px-4">
            {VOICES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => void fetch("/api/examiner/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "Hello, this is your IELTS examiner voice preview.", voice }) }).then(async (res) => { if (!res.ok) return; const blob = await res.blob(); const url = URL.createObjectURL(blob); if (audioRef.current) { audioRef.current.src = url; await audioRef.current.play(); } })}>Nghe thử giọng này</Button>
          <Button onClick={() => void startExam()} disabled={busy}>{busy ? "Đang tạo đề AI..." : "Bắt đầu thi thử"}</Button>
        </div>
      </Card>

      <Card className="p-6">
        {!started ? (
          <div>
            <p className="text-sm text-zinc-500">AI sẽ tạo đề thi riêng theo part anh chọn, kiểu câu gần format IELTS thật. Danh sách dưới đây chỉ là mẫu tham chiếu nền.</p>
            <div className="mt-4 space-y-4">
              {filtered.map((topic) => <div key={topic.name}><p className="font-semibold">{topic.name}</p><ul className="mt-2 space-y-2 text-sm text-zinc-600">{topic.questions.slice(0, 3).map((q) => <li key={q}>• {q}</li>)}</ul></div>)}
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Kết quả thi thử</h2>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-yellow-100 px-3 py-1">Overall {result.overall}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1">Fluency {result.fluency}</span>
              <span className="rounded-full bg-sky-100 px-3 py-1">Lexical {result.lexical}</span>
              <span className="rounded-full bg-pink-100 px-3 py-1">Grammar {result.grammar}</span>
              <span className="rounded-full bg-orange-100 px-3 py-1">Pronunciation {result.pronunciation}</span>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4 text-sm leading-7">
              <p className="font-semibold">Câu mẫu</p>
              <p className="mt-2">{result.sample_answer}</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-zinc-500">Câu {index + 1}/{questions.length}</p>
            <h2 className="mt-2 text-2xl font-semibold">{currentQuestion}</h2>
            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={() => void playQuestion()}><Play className="mr-2 size-4" />Nghe giám khảo</Button>
              <Button onClick={() => (recorderRef.current && recorderRef.current.state !== "inactive") ? stopRecording() : void startRecording()} disabled={busy}>
                {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mic className="mr-2 size-4" />}
                {recorderRef.current && recorderRef.current.state !== "inactive" ? "Dừng và nộp câu này" : "Bắt đầu trả lời"}
              </Button>
            </div>
            {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
          </div>
        )}
        <audio ref={audioRef} className="mt-4 w-full" controls />
      </Card>
    </div>
  );
}
