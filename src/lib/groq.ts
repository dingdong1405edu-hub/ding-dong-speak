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

const SYSTEM_PROMPT = `You are an IELTS Speaking examiner.
Return ONLY strict JSON with this exact shape:
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
- transcript_corrections must preserve original order of spoken words/phrases when possible.
- Mark wrong words with status=incorrect and provide corrected_word.
- Mark better alternatives with status=improved.
- Keep sample_answer concise but high-band natural English.
- topic_vocab should be useful IELTS vocabulary items, short phrases only.
- notes should contain short bullet-like feedback strings.`;

export type GradeResult = z.infer<typeof gradeSchema>;

export async function gradeSpeaking(input: { mode: string; promptText: string; transcript: string }) {
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
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Mode: ${input.mode}\nPrompt: ${input.promptText}\nStudent transcript: ${input.transcript}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned empty content");
  }

  return gradeSchema.parse(JSON.parse(content));
}
