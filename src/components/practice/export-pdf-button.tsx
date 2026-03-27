"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportPdfButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        const root = document.getElementById("practice-export-root");
        if (!root) return;
        const canvas = await html2canvas(root, { scale: 2, backgroundColor: "#ffffff" });
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = (canvas.height * pageWidth) / canvas.width;
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, pageHeight);
        pdf.save("ding-dong-speak-session.pdf");
      }}
    >
      <Download className="mr-2 size-4" />
      Xuất PDF
    </Button>
  );
}
