"use client";

import jsPDF from "jspdf";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportPdfButton({
  promptText,
  transcript,
  overall,
  fluency,
  lexical,
  grammar,
  pronunciation,
  sampleAnswer,
  notes,
  topicVocab,
}: {
  promptText: string;
  transcript: string;
  overall?: number;
  fluency?: number;
  lexical?: number;
  grammar?: number;
  pronunciation?: number;
  sampleAnswer?: string;
  notes?: string[];
  topicVocab?: string[];
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        const pdf = new jsPDF("p", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth();
        let y = 18;

        const addWrapped = (text: string, fontSize = 11, color: [number, number, number] = [39, 39, 42]) => {
          pdf.setFontSize(fontSize);
          pdf.setTextColor(...color);
          const lines = pdf.splitTextToSize(text, width - 24);
          pdf.text(lines, 12, y);
          y += lines.length * 6 + 4;
        };

        pdf.setFillColor(109, 40, 217);
        pdf.roundedRect(10, 10, width - 20, 20, 4, 4, "F");
        pdf.setFontSize(20);
        pdf.setTextColor(255, 255, 255);
        pdf.text("Ding Dong Speak Report", 14, 23);
        y = 40;

        pdf.setFontSize(12);
        pdf.setTextColor(82, 82, 91);
        pdf.text("Prompt", 12, y);
        y += 6;
        addWrapped(promptText);

        pdf.setTextColor(82, 82, 91);
        pdf.text("Transcript", 12, y);
        y += 6;
        addWrapped(transcript || "Chưa có transcript");

        const badges = [
          ["Overall", overall],
          ["Fluency", fluency],
          ["Lexical", lexical],
          ["Grammar", grammar],
          ["Pronunciation", pronunciation],
        ];

        pdf.setTextColor(82, 82, 91);
        pdf.text("Scores", 12, y);
        y += 8;
        let x = 12;
        for (const [label, value] of badges) {
          pdf.setFillColor(245, 243, 255);
          pdf.roundedRect(x, y - 5, 34, 10, 3, 3, "F");
          pdf.setFontSize(10);
          pdf.setTextColor(109, 40, 217);
          pdf.text(`${label}: ${value ?? "-"}`, x + 2, y + 1.5);
          x += 36;
          if (x > width - 40) {
            x = 12;
            y += 14;
          }
        }
        y += 16;

        pdf.setTextColor(82, 82, 91);
        pdf.text("Sample answer", 12, y);
        y += 6;
        addWrapped(sampleAnswer || "Chưa có câu mẫu.");

        pdf.setTextColor(82, 82, 91);
        pdf.text("Notes", 12, y);
        y += 6;
        addWrapped((notes && notes.length ? notes.map((n) => `• ${n}`).join("\n") : "Chưa có ghi chú."), 11, [63, 63, 70]);

        pdf.setTextColor(82, 82, 91);
        pdf.text("Topic vocabulary", 12, y);
        y += 6;
        addWrapped((topicVocab && topicVocab.length ? topicVocab.join(", ") : "Chưa có từ vựng chủ đề."), 11, [63, 63, 70]);

        pdf.save("ding-dong-speak-report.pdf");
      }}
    >
      <Download className="mr-2 size-4" />
      Xuất PDF
    </Button>
  );
}
