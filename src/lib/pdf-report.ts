import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Recommendation, SoilInput } from "./recommendations";

export function generatePDFReport(input: SoilInput, result: Recommendation) {
  const doc = new jsPDF();
  const margin = 18;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(34, 87, 50);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("NthakaGuide Report", margin, 19);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toDateString(), pageWidth - margin, 19, { align: "right" });
  y = 42;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Add a new page and reset y */
  const newPage = () => {
    doc.addPage();
    y = 20;
  };

  /** Ensure there is at least `space` mm before the bottom margin */
  const checkPage = (space = 20) => {
    if (y + space > 280) newPage();
  };

  /** Section heading with green title and horizontal rule */
  const section = (title: string) => {
    checkPage(18);
    y += 8;
    doc.setFontSize(14);
    doc.setTextColor(34, 87, 50);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, y);
    y += 4;
    doc.setDrawColor(180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
  };

  /**
   * Two-column label / value row.
   * Value is word-wrapped so it never overflows the right margin.
   */
  const text = (label: string, value: string) => {
    const valueX = margin + 58;
    const valueWidth = contentWidth - 58;

    // Measure wrapped lines
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(value, valueWidth) as string[];
    const blockHeight = lines.length * 6 + 2;

    checkPage(blockHeight + 4);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(lines, valueX, y);

    y += blockHeight;
  };

  /**
   * Wrapped paragraph block – black text, auto page-break.
   */
  const paragraph = (content: string, fontSize = 11) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(content, contentWidth) as string[];
    const lineH = fontSize * 0.45; // ~mm per line at given size

    // Split across pages if necessary
    let remaining = [...lines];
    while (remaining.length > 0) {
      const available = Math.floor((280 - y) / lineH);
      const chunk = remaining.splice(0, Math.max(available, 1));
      doc.text(chunk, margin, y);
      y += chunk.length * lineH + 2;
      if (remaining.length > 0) newPage();
    }
  };

  // ── Soil Bar Chart ───────────────────────────────────────────────────────────
  const drawSoilChart = () => {
    checkPage(65);
    const data = [
      { label: "N", value: input.nitrogen },
      { label: "P", value: input.phosphorus },
      { label: "K", value: input.potassium },
      { label: "pH", value: input.ph },
      { label: "OM", value: input.organicMatter },
    ];
    const max = Math.max(...data.map((d) => d.value), 1);
    const barW = 22;
    const gap = 10;
    const chartH = 42;
    let x = margin;

    data.forEach((d) => {
      const barH = (d.value / max) * chartH;
      // bar
      doc.setFillColor(34, 87, 50);
      doc.rect(x, y + chartH - barH, barW, barH, "F");
      // value label above bar
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(String(d.value), x + barW / 2, y + chartH - barH - 2, { align: "center" });
      // axis label
      doc.setFontSize(9);
      doc.text(d.label, x + barW / 2, y + chartH + 6, { align: "center" });
      x += barW + gap;
    });
    y += chartH + 14;
  };

  // ── Content ──────────────────────────────────────────────────────────────────

  section("Location & Climate");
  text("District", `${input.district.name} (${input.district.region})`);
  text("Rainfall", `${result.forecastedRainfall} mm`);
  text("Category", result.rainfallCategory);

  section("Soil Analysis");
  text("Nitrogen", `${input.nitrogen}`);
  text("Phosphorus", `${input.phosphorus}`);
  text("Potassium", `${input.potassium}`);
  text("pH", `${input.ph}`);
  text("Organic Matter", `${input.organicMatter}`);
  drawSoilChart();

  if (result.soilAssessment) {
    checkPage(12);
    paragraph(result.soilAssessment, 11);
    y += 4;
  }

  section("Crop Recommendations");

  result.crops.forEach((crop, i) => {
    checkPage(50);

    // Crop heading row
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`${i + 1}. ${crop.crop}`, margin, y);
    doc.setFontSize(11);
    doc.setTextColor(34, 87, 50);
    doc.text(`${crop.score}%`, pageWidth - margin, y, { align: "right" });
    y += 6;

    // Reason – wrapped, black
    if (crop.reason) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const reasonLines = doc.splitTextToSize(crop.reason, contentWidth) as string[];
      const lineH = 5;
      let rem = [...reasonLines];
      while (rem.length > 0) {
        const avail = Math.floor((280 - y) / lineH);
        const chunk = rem.splice(0, Math.max(avail, 1));
        doc.text(chunk, margin, y);
        y += chunk.length * lineH + 2;
        if (rem.length > 0) newPage();
      }
    }

    // Fertilizer table
    if (crop.fertilizerPlan?.items?.length) {
      checkPage(30);
      autoTable(doc, {
        startY: y,
        head: [["Timing", "Type", "Rate", "Notes"]],
        body: crop.fertilizerPlan.items.map((item) => [
          item.timing,
          item.type,
          item.applicationRate,
          item.notes || "",
        ]),
        theme: "grid",
        // Increase font sizes and use black text throughout
        styles: {
          fontSize: 10,
          textColor: [0, 0, 0],
          cellPadding: 3,
          overflow: "linebreak",   // ← key: wrap instead of truncate/overflow
          valign: "top",
        },
        headStyles: {
          fillColor: [34, 87, 50],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        // Distribute columns so Notes gets more room
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: "auto" },
        },
        tableWidth: contentWidth,
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      y += 4;
    }
  });

  // ── Page Numbers ─────────────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${i} / ${pages}`, pageWidth - margin, 290, { align: "right" });
  }

  doc.save("NthakaGuide_Premium_Report.pdf");
}
