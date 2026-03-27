"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Mic, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ExportPdfButton } from "@/components/practice/export-pdf-button";
import { formatDate, getModeLabel } from "@/lib/utils";

type GradeResponse = {
  sessionId: string;
  overall: number;
  fluency: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
  transcript_corrections: Array<{ original_word: string; status: "correct" | "incorrect" | "improved"; corrected_word: string }>;
  sample_answer: string;
  topic_vocab: string[];
  notes?: string[];
};

type RecentSession = {
  id: string;
  promptText: string;
  transcript: string;
  overallScore: number;
  fluency: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
  feedbackJson: unknown;
  createdAt: string;
};

export function PracticeStudio({
  mode,
  promptText,
  title,
  credits,
  isPro,
  recentSessions,
}: {
  mode: string;
  promptText: string;
  title: string;
  credits: number;
  isPro: boolean;
  recentSessions: RecentSession[];
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const renderedTranscript = useMemo(() => {
    if (!result) return null;
    return result.transcript_corrections.map((item, index) => {
      if (item.status === "incorrect") {
        return (
          <span key={`${item.original_word}-${index}`} className="mr-2 inline-block">
            <span className="text-red-500 line-through">{item.original_word}</span>{" "}
            <span className="text-green-500">{item.corrected_word}</span>
          </span>
        );
      }

      if (item.status === "improved" && item.corrected_word !== item.original_word) {
        return (
          <span key={`${item.original_word}-${index}`} className="mr-2 inline-block">
            <span className="text-zinc-500">{item.original_word}</span>{" "}
            <span className="text-green-500">{item.corrected_word}</span>
          </span>
        );
      }

      return <span key={`${item.original_word}-${index}`} className="mr-2 inline-block">{item.original_word}</span>;
    });
  }, [result]);

  async function startRecording() {
    setError(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "answer.webm");
      formData.append("mode", mode);
      formData.append("promptText", promptText);

      try {
        setBusy(true);
        const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
        const transcribeData = await transcribeRes.json();
        if (!transcribeRes.ok) throw new Error(transcribeData.error || "Không transcript được audio");
        setTranscript(transcribeData.transcript || "");

        const gradeRes = await fetch("/api/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, promptText, transcript: transcribeData.transcript, audioUrl: null }),
        });
        const gradeData = await gradeRes.json();
        if (!gradeRes.ok) throw new Error(gradeData.error || "Không chấm điểm được");
        setResult(gradeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      } finally {
        stream.getTracks().forEach((track) => track.stop());
        setBusy(false);
      }
    };

    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  const scoreBadges = result
    ? [
        ["Overall", result.overall],
        ["Fluency", result.fluency],
        ["Lexical", result.lexical],
        ["Grammar", result.grammar],
        ["Pronunciation", result.pronunciation],
      ]
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-rose-500">{getModeLabel(mode)}</p>
              <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">{promptText}</p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white">{isPro ? "PRO · 9999 credits" : `${credits} credits`}</div>
              <ExportPdfButton />
            </div>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <button
            type="button"
            onMouseDown={() => void startRecording()}
            onMouseUp={stopRecording}
            onMouseLeave={() => recording && stopRecording()}
            onTouchStart={() => void startRecording()}
            onTouchEnd={stopRecording}
            disabled={busy}
            className={`mx-auto flex h-40 w-40 items-center justify-center rounded-full border-8 transition ${recording ? "border-rose-300 bg-rose-500 text-white shadow-lg shadow-rose-200" : "border-rose-100 bg-rose-50 text-rose-600"}`}
          >
            {busy ? <Loader2 className="size-12 animate-spin" /> : <Mic className="size-12" />}
          </button>
          <h2 className="mt-6 text-2xl font-semibold">Ghi âm ngay</h2>
          <p className="mt-2 text-sm text-zinc-600">Nhấn giữ để thu âm. Thả ra để hệ thống transcript và chấm band.</p>
          {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Transcript đã xử lý</p>
          <div className="mt-4 min-h-24 rounded-2xl bg-zinc-50 p-4 text-base leading-8 text-zinc-900">
            {result ? renderedTranscript : transcript || "Chưa có transcript. Ghi âm một lượt để xem từ sai màu đỏ/gạch ngang và từ sửa màu xanh."}
          </div>
        </Card>

        {result ? (
          <Card className="p-6">
            <div className="flex flex-wrap gap-3">
              {scoreBadges.map(([label, score]) => (
                <div key={label} className="rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600">{label}: {score}</div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-700">Câu mẫu</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">{result.sample_answer}</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="font-semibold text-sky-700">Ghi chú</p>
                <ul className="mt-2 space-y-2 text-sm text-zinc-700">
                  {(result.notes ?? []).map((note, index) => <li key={`${note}-${index}`}>• {note}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-3"><Sparkles className="size-5 text-rose-500" /><h3 className="font-semibold">Sidebar AI</h3></div>
          <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-700">
            <div>
              <p className="font-semibold">Câu mẫu</p>
              <p>{result?.sample_answer || "Bài mẫu sẽ hiện ở đây sau khi chấm."}</p>
            </div>
            <div>
              <p className="font-semibold">Từ vựng</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(result?.topic_vocab ?? []).map((word) => <span key={word} className="rounded-full bg-zinc-100 px-3 py-1">{word}</span>)}
              </div>
            </div>
            <div>
              <p className="font-semibold">Ghi chú</p>
              <ul className="mt-2 space-y-2">
                {(result?.notes ?? ["AI note sẽ hiện sau khi có kết quả."]).map((note, index) => <li key={`${note}-${index}`}>• {note}</li>)}
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Lịch sử gần đây</p>
          <div className="mt-4 space-y-3">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-zinc-500">Chưa có phiên nào.</p>
            ) : recentSessions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-zinc-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Overall {item.overallScore}</p>
                  <span className="text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{item.transcript}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
