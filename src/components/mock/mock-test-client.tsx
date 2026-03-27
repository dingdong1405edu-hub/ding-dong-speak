"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Mic, Play, Square } from "lucide-react";
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

type RecorderState = {
  mediaRecorder: MediaRecorder;
  stream: MediaStream;
  mimeType: string;
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

function getSupportedRecorderMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((item) => MediaRecorder.isTypeSupported(item)) || "";
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
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<Grade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<RecorderState | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = useMemo(() => questions[index] || "", [questions, index]);
  const filtered = useMemo(() => topics.filter((topic) => topic.part === part), [topics, part]);

  async function playAudio(text: string) {
    const res = await fetch("/api/examiner/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (audioRef.current) {
      audioRef.current.src = url;
      await audioRef.current.play();
    }
  }

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
      console.error("[MockTestClient.startExam] Failed", { part, count, voice, error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : "Không tạo được đề AI");
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    if (!started || busy || recording) return;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      console.error("[MockTestClient.startRecording] mediaDevices unavailable", { userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown" });
      setError("Thiết bị này không hỗ trợ ghi âm trong trình duyệt.");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      console.error("[MockTestClient.startRecording] MediaRecorder unavailable", { userAgent: navigator.userAgent });
      setError("Trình duyệt hiện tại không hỗ trợ MediaRecorder.");
      return;
    }

    const mimeType = getSupportedRecorderMimeType();

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onerror = (event) => {
        console.error("[MockTestClient.mediaRecorder.onerror] Recorder error event", event);
        setError("Có lỗi khi ghi âm câu trả lời.");
      };

      mediaRecorder.onstop = async () => {
        const current = recorderRef.current;
        try {
          setBusy(true);
          const blob = new Blob(chunksRef.current, { type: current?.mimeType || mimeType || "audio/webm" });
          if (!blob || blob.size <= 0) {
            console.error("[MockTestClient.onstop] Empty blob", { mimeType: current?.mimeType || mimeType, chunkCount: chunksRef.current.length, question: currentQuestion });
            throw new Error("Audio rỗng, anh ghi âm lại câu này giúp em.");
          }

          const formData = new FormData();
          formData.append("audio", blob, `answer.${(current?.mimeType || mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm"}`);
          formData.append("mode", part);
          formData.append("promptText", currentQuestion);

          const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
          const transcribeData = await safeJson<{ transcript?: string; error?: string }>(transcribeRes);
          if (!transcribeRes.ok || !transcribeData.transcript) {
            console.error("[MockTestClient.onstop] /api/transcribe failed", { status: transcribeRes.status, transcribeData, part, currentQuestion });
            throw new Error(transcribeData.error || "Không transcript được");
          }

          const nextAnswers = [...answers, transcribeData.transcript];
          setAnswers(nextAnswers);

          if (index + 1 >= questions.length) {
            const gradeRes = await fetch("/api/mock/grade", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ part, questions, answers: nextAnswers, voice }),
            });
            const gradeData = await safeJson<Grade>(gradeRes);
            if (!gradeRes.ok) {
              console.error("[MockTestClient.onstop] /api/mock/grade failed", { status: gradeRes.status, gradeData, part, questions, nextAnswers, voice });
              throw new Error(gradeData.error || "Không chấm được mock test");
            }
            setResult(gradeData);
          } else {
            setIndex((prev) => prev + 1);
          }
        } catch (err) {
          console.error("[MockTestClient.onstop] Failed to finish answer", { part, currentQuestion, error: err instanceof Error ? err.message : String(err) });
          setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
          current?.stream.getTracks().forEach((track) => track.stop());
          recorderRef.current = null;
          setRecording(false);
          setBusy(false);
        }
      };

      recorderRef.current = { mediaRecorder, stream, mimeType: mimeType || "audio/webm" };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("[MockTestClient.startRecording] Failed", { part, currentQuestion, mimeType, error: err instanceof Error ? err.message : String(err) });
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      setRecording(false);
      setError(err instanceof Error ? err.message : "Không truy cập được microphone");
    }
  }

  function stopRecording() {
    const current = recorderRef.current;
    if (!current || current.mediaRecorder.state === "inactive") return;
    current.mediaRecorder.stop();
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
          <Button variant="outline" onClick={() => void playAudio("Hello, this is your IELTS examiner voice preview.")}>Nghe thử giọng này</Button>
          <Button onClick={() => void startExam()} disabled={busy}>{busy ? "Đang tạo đề AI..." : "Bắt đầu thi thử"}</Button>
        </div>
      </Card>

      <Card className="p-6">
        {!started ? (
          <div>
            <p className="text-sm text-zinc-500">AI sẽ tạo đề thi riêng theo part anh chọn, kiểu câu gần format IELTS thật. Danh sách dưới đây chỉ là mẫu tham chiếu nền.</p>
            <div className="mt-4 space-y-4">
              {filtered.map((topic) => (
                <div key={topic.name}>
                  <p className="font-semibold">{topic.name}</p>
                  <ul className="mt-2 space-y-2 text-sm text-zinc-600">{topic.questions.slice(0, 3).map((q) => <li key={q}>• {q}</li>)}</ul>
                </div>
              ))}
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
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void playAudio(currentQuestion)}><Play className="mr-2 size-4" />Nghe giám khảo</Button>
              <Button onClick={() => (recording ? stopRecording() : void startRecording())} disabled={busy}>
                {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : recording ? <Square className="mr-2 size-4" /> : <Mic className="mr-2 size-4" />}
                {recording ? "Dừng và nộp câu này" : "Bắt đầu trả lời"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-zinc-500">Trên mobile: bấm 1 lần để bắt đầu, bấm lần nữa để dừng và nộp câu hiện tại.</p>
            {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
          </div>
        )}
        <audio ref={audioRef} className="mt-4 w-full" controls />
      </Card>
    </div>
  );
}
