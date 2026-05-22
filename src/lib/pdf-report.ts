// ✅ PREMIUM PDF GENERATOR
// Features:
// 1. Clean layout
// 2. Table-based fertilizer plans (jspdf-autotable)
// 3. Soil bar chart
// 4. Structured UI-like sections

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Recommendation, SoilInput } from "./recommendations";

export function generatePDFReport(input: SoilInput, result: Recommendation) {
  const doc = new jsPDF();
  const margin = 18;
  const pageWidth = 210;
  let y = 20;

  // ─────────────────────────────
  // HEADER
  // ─────────────────────────────
  doc.setFillColor(34, 87, 50);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NthakaGuide Report", margin, 17);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toDateString(), pageWidth - margin, 17, { align: "right" });

  y = 38;

  // ─────────────────────────────
  // SECTION TITLE
  // ─────────────────────────────
  const section = (title: string) => {
    y += 6;
    doc.setFontSize(13);
    doc.setTextColor(34, 87, 50);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, y);

    y += 3;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  const text = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30);
    doc.text(value, margin + 55, y);
    y += 6;
  };

  const checkPage = (space = 20) => {
    if (y + space > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // ─────────────────────────────
  // SOIL CHART
  // ─────────────────────────────
  const drawSoilChart = () => {
    const data = [
      { label: "N", value: input.nitrogen },
      { label: "P", value: input.phosphorus },
      { label: "K", value: input.potassium },
      { label: "pH", value: input.ph },
      { label: "OM", value: input.organicMatter },
    ];

    const max = Math.max(...data.map(d => d.value));
    const barWidth = 20;
    const gap = 12;
    let x = margin;

    data.forEach(d => {
      const height = (d.value / max) * 40;
      doc.setFillColor(34, 87, 50);
      doc.rect(x, y + 40 - height, barWidth, height, "F");

      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.text(d.label, x + barWidth / 2, y + 45, { align: "center" });

      x += barWidth + gap;
    });

    y += 55;
  };

  // ─────────────────────────────
  // LOCATION
  // ─────────────────────────────
  section("Location & Climate");

  text("District", `${input.district.name} (${input.district.region})`);
  text("Rainfall", `${result.forecastedRainfall} mm`);
  text("Category", result.rainfallCategory);

  // ─────────────────────────────
  // SOIL
  // ─────────────────────────────
  section("Soil Analysis");

  text("Nitrogen", `${input.nitrogen}`);
  text("Phosphorus", `${input.phosphorus}`);
  text("Potassium", `${input.potassium}`);
  text("pH", `${input.ph}`);

  drawSoilChart();

  doc.setFontSize(10);
  doc.text(result.soilAssessment, margin, y);
  y += 10;

  // ─────────────────────────────
  // CROPS
  // ─────────────────────────────
  section("Crop Recommendations");

  result.crops.forEach((crop, i) => {
    checkPage(40);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${crop.crop}`, margin, y);

    doc.setFontSize(9);
    doc.text(`${crop.score}%`, pageWidth - margin, y, { align: "right" });
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(crop.reason, 170), margin, y);
    y += 10;

    // TABLE FERTILIZER PLAN
    if (crop.fertilizerPlan?.items?.length) {
      autoTable(doc, {
        startY: y,
        head: [["Timing", "Type", "Rate", "Notes"]],
        body: crop.fertilizerPlan.items.map(i => [
          i.timing,
          i.type,
          i.applicationRate,
          i.notes || "",
        ]),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 87, 50] },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    }
  });

  // ─────────────────────────────
  // FOOTER
  // ─────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i}/${pages}`, pageWidth - margin, 290, { align: "right" });
  }

  doc.save("NthakaGuide_Premium_Report.pdf");
}
