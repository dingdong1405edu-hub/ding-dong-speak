export async function speechToText(audioBuffer: ArrayBuffer, mimeType = "audio/webm") {
  try {
    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&language=en-US&smart_format=true&punctuate=true", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": mimeType,
      },
      body: Buffer.from(audioBuffer),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[deepgram.speechToText] Deepgram STT failed", {
        status: response.status,
        mimeType,
        errorText,
      });
      throw new Error(`Deepgram STT failed: ${response.status}`);
    }

    const data = await response.json();
    return (data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || "") as string;
  } catch (error) {
    console.error("[deepgram.speechToText] Unexpected error", {
      mimeType,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
