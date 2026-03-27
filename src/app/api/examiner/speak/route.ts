import { NextResponse } from "next/server";
import { textToSpeech } from "@/lib/deepgram";
import { getAuthSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const text = String(body.text || "").trim();
    const voice = String(body.voice || "aura-athena-en").trim();
    if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

    const audio = await textToSpeech(text, voice);
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg" } });
  } catch (error) {
    console.error("[api/examiner/speak] Failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Không đọc được câu hỏi" }, { status: 500 });
  }
}
