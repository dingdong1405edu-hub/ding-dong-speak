import { NextResponse } from "next/server";
import { generateTopicQuestions } from "@/lib/groq";
import { getAuthSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const topic = String(body.topic || "").trim();
    const part = String(body.part || "PART_1").trim();
    const count = Number(body.count || 5);
    if (!topic) return NextResponse.json({ error: "topic is required" }, { status: 400 });
    const generated = await generateTopicQuestions({ part, topic, count });
    return NextResponse.json(generated);
  } catch (error) {
    console.error("[api/questions/generate] Failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Không tạo được câu hỏi AI" }, { status: 500 });
  }
}
