export async function speechToText(audioBuffer: ArrayBuffer, mimeType = "audio/webm") {
  const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&language=en-US&smart_format=true&punctuate=true", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": mimeType,
    },
    body: Buffer.from(audioBuffer),
  });

  if (!response.ok) {
    throw new Error(`Deepgram STT failed: ${response.status}`);
  }

  const data = await response.json();
  return (data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || "") as string;
}
