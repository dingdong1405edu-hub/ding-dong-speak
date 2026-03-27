"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Mic, Plus, Sparkles, Square } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

type RecorderState = {
  mediaRecorder: MediaRecorder;
  stream: MediaStream;
  mimeType: string;
};

async function safeJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text || "Server returned invalid JSON");
  }
}

function getSupportedRecorderMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((item) => MediaRecorder.isTypeSupported(item)) || "";
}

export function PracticeStudio({
  mode,
  promptText,
  title,
  credits,
  isPro,
  recentSessions,
  savedWords,
}: {
  mode: string;
  promptText: string;
  title: string;
  credits: number;
  isPro: boolean;
  recentSessions: RecentSession[];
  savedWords: string[];
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSet, setSavedSet] = useState(new Set(savedWords));
  const recorderRef = useRef<RecorderState | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const renderedTranscript = useMemo(() => {
    if (!result) return transcript;
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

      return (
        <span key={`${item.original_word}-${index}`} className="mr-2 inline-block">
          {item.original_word}
        </span>
      );
    });
  }, [result, transcript]);

  async function saveWord(phrase: string) {
    if (!phrase || savedSet.has(phrase)) return;
    try {
      const response = await fetch("/api/vocab/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase, mode, source: promptText }),
      });
      const data = await safeJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Không lưu được từ vựng");
      setSavedSet((prev) => new Set(prev).add(phrase));
    } catch (err) {
      console.error("[PracticeStudio.saveWord] Failed", { phrase, mode, promptText, error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : "Không lưu được từ vựng");
    }
  }

  async function startRecording() {
    if (busy || recording) return;

    const safePromptText = promptText.trim();
    if (!safePromptText) {
      setError("Thiếu promptText nên chưa thể gửi bài đi chấm.");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      console.error("[PracticeStudio.startRecording] mediaDevices unavailable", { userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown" });
      setError("Thiết bị này không hỗ trợ ghi âm trong trình duyệt.");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      console.error("[PracticeStudio.startRecording] MediaRecorder unavailable", { userAgent: navigator.userAgent });
      setError("Trình duyệt hiện tại không hỗ trợ MediaRecorder.");
      return;
    }

    const mimeType = getSupportedRecorderMimeType();

    try {
      setError(null);
      setResult(null);
      setTranscript("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onerror = (event) => {
        console.error("[PracticeStudio.mediaRecorder.onerror] Recorder error event", event);
        setError("Có lỗi khi ghi âm, anh thử lại giúp em.");
      };

      mediaRecorder.onstop = async () => {
        const current = recorderRef.current;
        try {
          setBusy(true);
          const blob = new Blob(chunksRef.current, { type: current?.mimeType || mimeType || "audio/webm" });
          if (!blob || blob.size <= 0) {
            console.error("[PracticeStudio.onstop] Empty blob after recording", { mimeType: current?.mimeType || mimeType, chunkCount: chunksRef.current.length });
            throw new Error("Audio rỗng, anh ghi âm lại giúp em.");
          }

          const formData = new FormData();
          formData.append("audio", blob, `answer.${(current?.mimeType || mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm"}`);
          formData.append("mode", mode);
          formData.append("promptText", safePromptText);

          const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
          const transcribeData = await safeJson<{ transcript?: string; error?: string }>(transcribeRes);
          if (!transcribeRes.ok) {
            console.error("[PracticeStudio.onstop] /api/transcribe failed", { status: transcribeRes.status, transcribeData, mode, promptText: safePromptText });
            throw new Error(transcribeData.error || "Không transcript được audio");
          }

          const safeTranscript = String(transcribeData.transcript || "").trim();
          if (!safeTranscript) {
            console.error("[PracticeStudio.onstop] Empty transcript after transcribe", { transcribeData, mode, promptText: safePromptText });
            throw new Error("Transcript đang rỗng, em chưa gửi xuống backend để chấm.");
          }
          setTranscript(safeTranscript);

          const gradeRes = await fetch("/api/grade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode, promptText: safePromptText, transcript: safeTranscript, audioUrl: null }),
          });
          const gradeData = await safeJson<GradeResponse & { error?: string }>(gradeRes);
          if (!gradeRes.ok) {
            console.error("[PracticeStudio.onstop] /api/grade failed", { status: gradeRes.status, gradeData, mode, promptText: safePromptText, transcript: safeTranscript });
            throw new Error(gradeData.error || "Không chấm điểm được");
          }
          setResult(gradeData);
        } catch (err) {
          console.error("[PracticeStudio.onstop] Failed to finish speaking flow", {
            mode,
            promptText: safePromptText,
            error: err instanceof Error ? err.message : String(err),
          });
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
      console.error("[PracticeStudio.startRecording] Failed to start recorder", {
        mode,
        promptText: safePromptText,
        mimeType,
        error: err instanceof Error ? err.message : String(err),
      });
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

  const activeFeedback = result ?? null;

  return (
    <div className="space-y-6" id="practice-export-root">
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <span>Trang chủ</span>
          <span>›</span>
          <span>Luyện từng câu</span>
          <span>›</span>
          <span>{getModeLabel(mode)}</span>
          <span>›</span>
          <span className="text-zinc-900">{title}</span>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden border border-zinc-200 bg-[#eef1ff] p-0">
          <div className="max-h-[780px] overflow-y-auto p-6">
            {recentSessions.length ? recentSessions.map((item) => {
              const feedback = item.feedbackJson as GradeResponse;
              return (
                <div key={item.id} className="mb-6 rounded-[28px] border border-white/70 bg-[#dde4ff] p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500">{formatDate(item.createdAt)}</p>
                      <p className="mt-3 text-base leading-8 text-zinc-800">{item.transcript}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-teal-100 px-3 py-1">Trôi chảy: {item.fluency}</span>
                        <span className="rounded-full bg-yellow-100 px-3 py-1">Từ vựng: {item.lexical}</span>
                        <span className="rounded-full bg-pink-100 px-3 py-1">Ngữ pháp: {item.grammar}</span>
                        <span className="rounded-full bg-orange-100 px-3 py-1">Phát âm: {item.pronunciation}</span>
                      </div>
                      {feedback.sample_answer ? (
                        <div className="mt-5 rounded-2xl bg-white/70 p-4 text-sm leading-7 text-zinc-700">
                          <p className="font-semibold text-emerald-700">Cải thiện câu</p>
                          <p className="mt-2">{feedback.sample_answer}</p>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex size-16 items-center justify-center rounded-full bg-yellow-300 text-2xl font-bold text-zinc-900">
                      {item.overallScore}
                    </div>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-zinc-500">Chưa có lịch sử. Ghi âm bài đầu tiên đi anh.</p>}
          </div>

          <div className="border-t border-white/70 bg-white/60 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <button type="button" className="rounded-full border border-zinc-200 bg-white p-2"><ArrowLeft className="size-4" /></button>
                <span className="line-clamp-2">{promptText}</span>
                <button type="button" className="rounded-full border border-zinc-200 bg-white p-2"><ArrowRight className="size-4" /></button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ExportPdfButton
                  promptText={promptText}
                  transcript={transcript}
                  overall={activeFeedback?.overall}
                  fluency={activeFeedback?.fluency}
                  lexical={activeFeedback?.lexical}
                  grammar={activeFeedback?.grammar}
                  pronunciation={activeFeedback?.pronunciation}
                  sampleAnswer={activeFeedback?.sample_answer}
                  notes={activeFeedback?.notes}
                  topicVocab={activeFeedback?.topic_vocab}
                />
                <Button className="rounded-full bg-violet-600 px-6" onClick={() => (recording ? stopRecording() : void startRecording())} disabled={busy}>
                  {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : recording ? <Square className="mr-2 size-4" /> : <Mic className="mr-2 size-4" />}
                  {recording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
                </Button>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">Trên mobile: bấm 1 lần để bắt đầu, bấm lần nữa để dừng và gửi đi chấm.</p>
            {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-2 border-b border-zinc-100 text-sm font-medium text-zinc-500">
              <div className="bg-white px-4 py-3 text-center text-zinc-900">AI hỗ trợ</div>
              <div className="bg-zinc-50 px-4 py-3 text-center">Bảng vàng ({recentSessions.length})</div>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-2xl border border-zinc-100 p-4">
                <p className="text-sm font-medium">Cho mình câu mẫu</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{activeFeedback?.sample_answer || "Khi có kết quả chấm, câu mẫu sẽ hiện ở đây."}</p>
              </div>
              <div className="rounded-2xl border border-zinc-100 p-4">
                <p className="text-sm font-medium">Ghi chú</p>
                <ul className="mt-2 space-y-2 text-sm text-zinc-600">
                  {(activeFeedback?.notes ?? ["Chưa có note."]).map((note, index) => <li key={`${note}-${index}`}>• {note}</li>)}
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-zinc-100 p-4">
                <p className="text-sm font-medium">Transcript</p>
                <div className="mt-3 text-sm leading-7 text-zinc-700">{renderedTranscript || "Chưa có transcript."}</div>
              </div>
              <div className="rounded-2xl border border-zinc-100 p-4">
                <p className="text-sm font-medium">Từ vựng chủ đề</p>
                <div className="mt-3 space-y-2">
                  {(activeFeedback?.topic_vocab ?? []).map((word) => (
                    <div key={word} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-3 py-2 text-sm">
                      <span>{word}</span>
                      <button type="button" onClick={() => void saveWord(word)} className="rounded-full border border-zinc-200 bg-white p-1.5 text-violet-600 disabled:opacity-50" disabled={savedSet.has(word)}>
                        <Plus className="size-4" />
                      </button>
                    </div>
                  ))}
                  {activeFeedback?.topic_vocab?.length ? null : <p className="text-sm text-zinc-500">Chưa có từ vựng chủ đề.</p>}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Luyện phát âm</p>
                  <span className="text-xs text-violet-600">Lưu vào ôn tập</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-600">Bấm dấu + cạnh từ vựng để đẩy sang trang ôn tập và xem lại lâu dài.</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3"><Sparkles className="size-5 text-violet-500" /><p className="font-semibold">Phiên hiện tại</p></div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">{getModeLabel(mode)}</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">{isPro ? "Pro" : `${credits}/30 free`}</span>
              {activeFeedback ? <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm">Overall {activeFeedback.overall}</span> : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
