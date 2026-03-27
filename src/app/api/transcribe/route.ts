import { NextResponse } from "next/server";
import { speechToText } from "@/lib/deepgram";
import { getAuthSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("audio");
    const promptText = String(formData.get("promptText") || "").trim();
    const mode = String(formData.get("mode") || "PART_1").trim();

    if (!(file instanceof File)) {
      console.error("[api/transcribe] Missing audio file", { mode, promptText, userId: session.user.id });
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    if (!promptText) {
      console.error("[api/transcribe] Missing promptText", { mode, userId: session.user.id, fileName: file.name, fileSize: file.size });
      return NextResponse.json({ error: "promptText is required" }, { status: 400 });
    }

    if (file.size <= 0) {
      console.error("[api/transcribe] Empty audio file", { mode, promptText, userId: session.user.id, fileName: file.name });
      return NextResponse.json({ error: "Audio file is empty" }, { status: 400 });
    }

    const transcript = (await speechToText(await file.arrayBuffer(), file.type || "audio/webm")).trim();

    if (!transcript) {
      console.error("[api/transcribe] Deepgram returned empty transcript", {
        mode,
        promptText,
        userId: session.user.id,
        fileName: file.name,
        fileSize: file.size,
      });
      return NextResponse.json({ error: "Transcript is empty, please try again." }, { status: 422 });
    }

    return NextResponse.json({ transcript, mode, promptText });
  } catch (error) {
    console.error("[api/transcribe] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Không chuyển giọng nói thành văn bản được" }, { status: 500 });
  }
}
