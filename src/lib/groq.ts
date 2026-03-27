import { z } from "zod";

const gradeSchema = z.object({
  overall: z.number().int().min(0).max(9),
  fluency: z.number().int().min(0).max(9),
  lexical: z.number().int().min(0).max(9),
  grammar: z.number().int().min(0).max(9),
  pronunciation: z.number().int().min(0).max(9),
  transcript_corrections: z.array(
    z.object({
      original_word: z.string(),
      status: z.enum(["correct", "incorrect", "improved"]),
      corrected_word: z.string(),
    }),
  ),
  sample_answer: z.string(),
  topic_vocab: z.array(z.string()),
  notes: z.array(z.string()).optional(),
});

const questionSchema = z.object({
  topic: z.string(),
  questions: z.array(z.string()).min(3).max(8),
});

const SYSTEM_PROMPT = `You are a very strict IELTS Speaking examiner.
Return ONLY pure JSON. Do not wrap in markdown. Do not use code fences. Do not add explanations before or after the JSON.
Return this exact shape:
{
  "overall": 0,
  "fluency": 0,
  "lexical": 0,
  "grammar": 0,
  "pronunciation": 0,
  "transcript_corrections": [
    {"original_word":"", "status":"correct", "corrected_word":""}
  ],
  "sample_answer": "",
  "topic_vocab": [""],
  "notes": [""]
}
Rules:
- Scores are IELTS-style whole numbers from 0 to 9.
- Be strict. Do not over-score weak answers.
- If the response is short, repetitive, vague, unnatural, or contains grammar problems, reduce the score noticeably.
- transcript_corrections must preserve original order of spoken words/phrases when possible.
- Mark wrong words with status=incorrect and provide corrected_word.
- Mark better alternatives with status=improved.
- Keep sample_answer concise but high-band natural English.
- topic_vocab should be useful IELTS vocabulary items, short phrases only.
- notes should contain short bullet-like feedback strings.`;

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1);
  return trimmed;
}

function parseWithSchema<T>(content: string, schema: z.ZodSchema<T>, label: string) {
  const candidate = extractJsonObject(content);
  try {
    return schema.parse(JSON.parse(candidate));
  } catch (error) {
    console.error(`[groq.${label}] Failed to parse/validate model JSON`, {
      rawContent: content,
      candidate,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("LLM returned invalid JSON payload");
  }
}

async function requestGroq(messages: Array<{ role: "system" | "user"; content: string }>) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("[groq.requestGroq] Groq request failed", { status: response.status, body: errorText, messages });
    throw new Error(`Groq request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[groq.requestGroq] Groq returned empty content", { data, messages });
    throw new Error("Groq returned empty content");
  }
  return content as string;
}

export type GradeResult = z.infer<typeof gradeSchema>;
export type GeneratedQuestions = z.infer<typeof questionSchema>;

export async function gradeSpeaking(input: { mode: string; promptText: string; transcript: string }) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const content = await requestGroq([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Mode: ${input.mode}\nPrompt: ${input.promptText}\nStudent transcript: ${input.transcript}` },
      ]);
      return parseWithSchema(content, gradeSchema, "gradeSpeaking");
    } catch (error) {
      lastError = error;
      console.error("[groq.gradeSpeaking] Attempt failed", { attempt, input, error: error instanceof Error ? error.message : String(error) });
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Không parse được dữ liệu chấm điểm từ LLM");
}

export async function gradeMockExam(input: { part: string; questions: string[]; answers: string[] }) {
  const transcript = input.answers.join(" ").trim();
  const promptText = input.questions.map((question, index) => `${index + 1}. ${question}`).join("\n");
  return gradeSpeaking({ mode: input.part, promptText: `Mock exam questions:\n${promptText}`, transcript });
}

export async function generateTopicQuestions(input: { part: string; topic: string; count?: number }) {
  const content = await requestGroq([
    {
      role: "system",
      content: `You are an IELTS speaking material writer. Return ONLY pure JSON with shape {"topic":"...","questions":["..."]}. Generate ${input.count ?? 5} strict IELTS-style questions suitable for the requested part. No markdown.` ,
    },
    { role: "user", content: `Part: ${input.part}\nRequested topic: ${input.topic}\nNumber of questions: ${input.count ?? 5}` },
  ]);
  return parseWithSchema(content, questionSchema, "generateTopicQuestions");
}
