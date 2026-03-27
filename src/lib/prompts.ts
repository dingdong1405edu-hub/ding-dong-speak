export const PRACTICE_PRESETS = [
  {
    mode: "PART_1",
    title: "Part 1 · Everyday Life",
    promptText: "Tell me about your hometown and what you usually do there on weekends.",
    description: "Khởi động nhanh với câu hỏi cá nhân ngắn, dễ lấy đà nói.",
  },
  {
    mode: "PART_2",
    title: "Part 2 · Cue Card",
    promptText: "Describe a skill that you would like to learn in the future. You should say what it is, why you want to learn it, how you would learn it, and explain how it could change your life.",
    description: "Cue card đủ dài để luyện triển khai ý và giữ nhịp 1-2 phút.",
  },
  {
    mode: "PART_3",
    title: "Part 3 · Discussion",
    promptText: "Why do some people find it difficult to stay motivated when learning a new language, and what can schools or technology do to help them?",
    description: "Tập phản biện, giải thích nguyên nhân-hệ quả, nâng lexical + grammar.",
  },
  {
    mode: "MOCK_TEST",
    title: "Thi thử mini",
    promptText: "You are taking a mini IELTS speaking mock test. Introduce yourself, then talk about a memorable teacher, and finally discuss whether technology has improved education overall.",
    description: "Gộp nhiều dạng câu hỏi để mô phỏng áp lực thi thật.",
  },
] as const;

export function getPromptByMode(mode: string) {
  return PRACTICE_PRESETS.find((item) => item.mode === mode) ?? PRACTICE_PRESETS[0];
}
