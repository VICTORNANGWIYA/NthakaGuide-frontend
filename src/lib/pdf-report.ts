import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Recommendation, SoilInput } from "./recommendations";

export function generatePDFReport(input: SoilInput, result: Recommendation) {
  const doc = new jsPDF();
  const margin = 18;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Header
  doc.setFillColor(34, 87, 50);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("NthakaGuide Report", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toDateString(), pageWidth - margin, 18, { align: "right" });
  y = 38;

  const section = (title: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    y += 4;
    doc.setFontSize(14);
    doc.setTextColor(34, 87, 50);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(34, 87, 50);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  // Render any key/value list as a two-column table — auto-wraps & paginates
  const kvTable = (rows: [string, string][]) => {
    autoTable(doc, {
      startY: y,
      body: rows,
      theme: "plain",
      styles: {
        fontSize: 11,
        textColor: [0, 0, 0],
        cellPadding: 2.5,
        overflow: "linebreak",
        valign: "top",
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 55, textColor: [0, 0, 0] },
        1: { cellWidth: contentWidth - 55, textColor: [0, 0, 0] },
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  };

  // Paragraph that wraps cleanly via autoTable (single full-width cell)
  const paragraph = (txt: string) => {
    autoTable(doc, {
      startY: y,
      body: [[txt]],
      theme: "plain",
      styles: {
        fontSize: 11,
        textColor: [0, 0, 0],
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles: { 0: { cellWidth: contentWidth } },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  };

  const drawSoilChart = () => {
    if (y + 60 > 280) { doc.addPage(); y = 20; }
    const data = [
      { label: "N", value: input.nitrogen },
      { label: "P", value: input.phosphorus },
      { label: "K", value: input.potassium },
      { label: "pH", value: input.ph },
      { label: "OM", value: input.organicMatter },
    ];
    const max = Math.max(...data.map(d => d.value), 1);
    const barWidth = 22;
    const gap = 14;
    let x = margin;
    data.forEach(d => {
      const h = (d.value / max) * 40;
      doc.setFillColor(34, 87, 50);
      doc.rect(x, y + 40 - h, barWidth, h, "F");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(String(d.value), x + barWidth / 2, y + 38 - h, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(d.label, x + barWidth / 2, y + 47, { align: "center" });
      x += barWidth + gap;
    });
    y += 55;
  };

  // --- Location & Climate ---
  section("Location & Climate");
  kvTable([
    ["District", `${input.district.name} (${input.district.region})`],
    ["Rainfall", `${result.forecastedRainfall} mm`],
    ["Category", result.rainfallCategory],
  ]);

  // --- Soil Analysis ---
  section("Soil Analysis");
  kvTable([
    ["Nitrogen (N)", `${input.nitrogen}`],
    ["Phosphorus (P)", `${input.phosphorus}`],
    ["Potassium (K)", `${input.potassium}`],
    ["pH", `${input.ph}`],
    ["Organic Matter", `${input.organicMatter}`],
  ]);
  drawSoilChart();
  paragraph(result.soilAssessment);

  // --- Crop Recommendations ---
  section("Crop Recommendations");
  result.crops.forEach((crop, i) => {
    // Crop heading + score as a single-row table so it never overflows
    autoTable(doc, {
      startY: y,
      body: [[`${i + 1}. ${crop.crop}`, `${crop.score}%`]],
      theme: "grid",
      styles: {
        fontSize: 12,
        textColor: [0, 0, 0],
        fontStyle: "bold",
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: contentWidth - 30, fillColor: [240, 247, 240] },
        1: { cellWidth: 30, halign: "right", fillColor: [34, 87, 50], textColor: [255, 255, 255] },
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 2;

    paragraph(crop.reason);

    if (crop.fertilizerPlan?.items?.length) {
      autoTable(doc, {
        startY: y,
        head: [["Timing", "Type", "Rate", "Notes"]],
        body: crop.fertilizerPlan.items.map(it => [
          it.timing,
          it.type,
          it.applicationRate,
          it.notes || "",
        ]),
        theme: "grid",
        styles: {
          fontSize: 10,
          textColor: [0, 0, 0],
          cellPadding: 3,
          overflow: "linebreak",
          valign: "top",
        },
        headStyles: {
          fillColor: [34, 87, 50],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 40 },
          2: { cellWidth: 35 },
          3: { cellWidth: contentWidth - 107 },
        },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  });

  // Footer page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`Page ${i}/${pages}`, pageWidth - margin, 290, { align: "right" });
  }
  doc.save("NthakaGuide_Premium_Report.pdf");
}
