import { NextResponse } from "next/server";
import { speechToText } from "@/lib/deepgram";
import { getAuthSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("audio");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const transcript = await speechToText(await file.arrayBuffer(), file.type || "audio/webm");
    return NextResponse.json({ transcript });
  } catch {
    return NextResponse.json({ error: "Không chuyển giọng nói thành văn bản được" }, { status: 500 });
  }
}
