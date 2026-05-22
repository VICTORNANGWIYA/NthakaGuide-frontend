import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavHeader from "@/components/NavHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MALAWI_DISTRICTS } from "@/lib/malawi-districts";
import {
  Loader2, CloudRain, TrendingUp, Calendar, BarChart3,
  Satellite, AlertTriangle, Droplets, Wind, Sun,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LETTER = ["J","F","M","A","M","J","J","A","S","O","N","D"];
const RAINY_MONTHS  = new Set(["Nov","Dec","Jan","Feb","Mar","Apr","May"]);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface DailyEntry   { date: string; mm: number }
interface WeeklyEntry  { week: string; start: string; end: string; days: number; total_mm: number; avg_mm: number }
interface MonthlyEntry { month: string; year?: number; mm: number }

interface RainfallData {
  annualForecastMm:    number;
  annualConfidence:    number;
  annualSource:        string;
  band:                string;
  bandDescription:     string;
  avgAnnualRainfall:   number;
  stationName:         string | null;
  seasonLabel:         string;
  seasonPeriod:        string;
  inRainySeason:       boolean;
  seasonTotalMm:       number;
  seasonMonths:        string[];
  historicalYears:     number[];
  historicalValues:    number[];
  monthlyDistribution: MonthlyEntry[];
  monthlySource:       string | null;
  dailyData:           DailyEntry[];
  dailyAvailableDays:  number;
  weeklyData:          WeeklyEntry[];
  live7DayMm:          number | null;
  live7DayDescription: string | null;
  liveDailyForecast:   DailyEntry[];
  fertilizerCalendar:  { month: string; action: string }[];
  cropSuitability:     { crop: string; emoji: string; suitability: number }[];
  risks:               { level: string; icon: string; message: string }[];
}

type TabId = "annual" | "monthly" | "weekly" | "daily";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function isLiveSatellite(source: string): boolean {
  return source.toLowerCase().includes("nasa") && !source.toLowerCase().includes("unavailable");
}

function bandColor(band: string): string {
  switch (band) {
    case "Very High": return "#3b82f6";
    case "High":      return "#06b6d4";
    case "Moderate":  return "#10b981";
    case "Low":       return "#f59e0b";
    case "Very Low":  return "#ef4444";
    default:          return "#6366f1";
  }
}

function confidenceColor(c: number): string {
  if (c >= 80) return "#10b981";
  if (c >= 65) return "#f59e0b";
  return "#ef4444";
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE BADGE
// ─────────────────────────────────────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  const live = isLiveSatellite(source);
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
      live
        ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950 dark:border-emerald-800"
        : "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800"
    }`}>
      {live ? <Satellite className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {live ? "Live satellite" : "Fallback estimate"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANNUAL HISTORY CHART
// Clear: labelled axes, gridlines, avg line, forecast bar distinguished
// ─────────────────────────────────────────────────────────────────────────────
function AnnualChart({
  years, values, forecast, avg,
}: {
  years: number[]; values: number[]; forecast: number; avg: number;
}) {
  const allValues = [...values, forecast];
  const maxVal    = Math.max(...allValues, avg) * 1.15;
  const minVal    = Math.min(...allValues, avg) * 0.85;
  const range     = maxVal - minVal || 1;

  const gridLines = [0, 25, 50, 75, 100].map(pct => ({
    pct,
    mm: Math.round(minVal + (range * pct) / 100),
  }));

  const barH = (v: number) => Math.max(1, ((v - minVal) / range) * 100);
  const avgPct = ((avg - minVal) / range) * 100;

  if (!years.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No historical data available.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-sky-400/70 inline-block" />
          Historical annual total (mm)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
          EWMA forecast (next season)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-8 border-t-2 border-dashed border-amber-500 inline-block" />
          District average ({avg}mm)
        </span>
      </div>

      {/* Chart area */}
      <div className="relative" style={{ height: 220 }}>
        {/* Y-axis gridlines + labels */}
        {gridLines.map(g => (
          <div
            key={g.pct}
            className="absolute left-0 right-0 flex items-center"
            style={{ bottom: `${g.pct}%` }}
          >
            <span className="text-[10px] text-muted-foreground w-10 text-right pr-2 shrink-0 select-none">
              {g.mm}
            </span>
            <div className="flex-1 border-t border-border/50" />
          </div>
        ))}

        {/* Average line */}
        <div
          className="absolute left-10 right-0 border-t-2 border-dashed border-amber-500/80 z-10 pointer-events-none"
          style={{ bottom: `${avgPct}%` }}
        />

        {/* Bars */}
        <div className="absolute left-10 right-0 bottom-0 top-0 flex items-end gap-[3px] px-1">
          {values.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none shadow-lg">
                <strong>{years[i]}</strong>: {v.toFixed(0)}mm
              </div>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.4, delay: i * 0.015, ease: "easeOut" }}
                style={{
                  height: `${barH(v)}%`,
                  originY: 1,
                  backgroundColor: v < avg ? "#f59e0b99" : "#38bdf899",
                }}
                className="w-full rounded-t-[2px] hover:brightness-125 transition-all cursor-default"
              />
            </div>
          ))}

          {/* Forecast bar — visually distinct */}
          <div className="flex-1 flex flex-col justify-end h-full group relative ml-1">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none shadow-lg">
              <strong>Forecast {(years[years.length - 1] ?? 0) + 1}</strong>: {forecast.toFixed(0)}mm
            </div>
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, delay: values.length * 0.015 + 0.1, ease: "easeOut" }}
              style={{ height: `${barH(forecast)}%`, originY: 1 }}
              className="w-full rounded-t-[2px] bg-primary ring-2 ring-primary ring-offset-1 ring-offset-background cursor-default"
            />
            <span className="text-[8px] text-primary font-black text-center mt-0.5">FC</span>
          </div>
        </div>
      </div>

      {/* X-axis year labels — show every 5 years to avoid clutter */}
      <div className="flex gap-[3px] pl-10 px-1">
        {years.map((y, i) => (
          <span key={i} className="flex-1 text-center text-[8px] text-muted-foreground truncate">
            {i % 5 === 0 ? y : ""}
          </span>
        ))}
        <span className="flex-1 text-center text-[8px] text-primary font-bold ml-1"> </span>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground pt-1 pl-10">
        <span>Min: <strong className="text-foreground">{Math.min(...values).toFixed(0)}mm</strong></span>
        <span>Max: <strong className="text-foreground">{Math.max(...values).toFixed(0)}mm</strong></span>
        <span>Avg: <strong className="text-foreground">{avg}mm</strong></span>
        <span>Forecast: <strong className="text-primary">{forecast.toFixed(0)}mm</strong></span>
        <span>
          Trend vs avg:{" "}
          <strong className={forecast > avg ? "text-sky-500" : "text-amber-500"}>
            {forecast > avg ? "▲" : "▼"} {Math.abs(forecast - avg).toFixed(0)}mm {forecast > avg ? "above" : "below"}
          </strong>
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY CHART
// Clear: labelled axes, rainy/dry season annotated, mm values on hover,
// season band shading
// ─────────────────────────────────────────────────────────────────────────────
function MonthlyChart({
  monthlyMap, maxMonthly, source,
}: {
  monthlyMap: Record<string, number>; maxMonthly: number; source: string | null;
}) {
  const values = MONTHS_SHORT.map(m => monthlyMap[m] ?? 0);
  const total  = values.reduce((a, b) => a + b, 0);

  // Y gridlines at 25% intervals of maxMonthly rounded up
  const yMax   = Math.ceil(maxMonthly / 50) * 50 || 50;
  const grids  = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax].map(v => Math.round(v));

  return (
    <div className="space-y-3">
      {/* Legend + source */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground items-center">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-sky-500/70 inline-block" />
          Rainy season (Nov–May)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-muted-foreground/25 inline-block" />
          Dry season (Jun–Oct)
        </span>
        {source && (
          <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            source.includes("Computed")
              ? "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950"
              : "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950"
          }`}>
            {source}
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: 200 }}>
        {/* Gridlines */}
        {grids.map((g, gi) => (
          <div key={gi} className="absolute left-0 right-0 flex items-center" style={{ bottom: `${(g / yMax) * 100}%` }}>
            <span className="text-[10px] text-muted-foreground w-9 text-right pr-2 shrink-0 select-none">{g}</span>
            <div className="flex-1 border-t border-border/40" />
          </div>
        ))}

        {/* Season band shading (behind bars) */}
        <div className="absolute left-9 right-0 bottom-0 top-0 flex">
          {MONTHS_SHORT.map((m, i) => (
            <div
              key={i}
              className={`flex-1 ${RAINY_MONTHS.has(m) ? "bg-sky-500/5" : ""}`}
            />
          ))}
        </div>

        {/* Bars */}
        <div className="absolute left-9 right-0 bottom-0 top-0 flex items-end gap-[3px] px-0.5">
          {MONTHS_SHORT.map((m, i) => {
            const v       = values[i];
            const isRainy = RAINY_MONTHS.has(m);
            const pct     = yMax > 0 ? (v / yMax) * 100 : 0;
            return (
              <div key={m} className="flex-1 flex flex-col justify-end h-full group relative">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none shadow-lg">
                  <strong>{m}</strong>: {v.toFixed(1)}mm
                  <br />
                  <span className="text-[9px] opacity-70">{total > 0 ? ((v / total) * 100).toFixed(0) : 0}% of annual</span>
                </div>
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.04, ease: "easeOut" }}
                  style={{ height: `${Math.max(pct, v > 0 ? 1.5 : 0)}%`, originY: 1 }}
                  className={`w-full rounded-t-sm cursor-default transition-all hover:brightness-125 ${
                    isRainy ? "bg-sky-500/70" : "bg-slate-400/40"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Month labels with season indicator */}
      <div className="flex gap-[3px] pl-9 px-0.5">
        {MONTHS_SHORT.map((m, i) => (
          <span key={i} className={`flex-1 text-center text-[9px] font-semibold ${
            RAINY_MONTHS.has(m) ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground"
          }`}>
            {MONTHS_LETTER[i]}
          </span>
        ))}
      </div>

      {/* Season annotation */}
      <div className="pl-9 flex gap-[3px] text-[9px]">
        <div className="flex-[7] text-center text-sky-600 dark:text-sky-400 font-semibold border-t border-sky-400/50 pt-0.5">
          ← Rainy (Nov–May)
        </div>
        <div className="flex-[5] text-center text-muted-foreground border-t border-muted/50 pt-0.5">
          Dry (Jun–Oct) →
        </div>
      </div>

      {/* Monthly totals table — compact */}
      <div className="grid grid-cols-6 gap-1 pt-1">
        {MONTHS_SHORT.map((m, i) => (
          <div key={m} className={`text-center p-1.5 rounded text-[10px] ${
            RAINY_MONTHS.has(m) ? "bg-sky-50 dark:bg-sky-950/40" : "bg-muted/30"
          }`}>
            <div className="font-bold text-foreground">{m}</div>
            <div className={`font-semibold ${RAINY_MONTHS.has(m) ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground"}`}>
              {values[i].toFixed(0)}mm
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY CHART
// Clear: bars with total labels, week date range shown
// ─────────────────────────────────────────────────────────────────────────────
function WeeklyChart({ weeks }: { weeks: WeeklyEntry[] }) {
  if (!weeks.length) {
    return <p className="text-muted-foreground text-sm py-12 text-center">No weekly data available.</p>;
  }

  const maxVal = Math.max(...weeks.map(w => w.total_mm), 1);
  const yMax   = Math.ceil(maxVal / 10) * 10;
  const grids  = [0, yMax * 0.5, yMax].map(v => Math.round(v));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Weekly totals from NASA POWER · last {weeks.length * 7} days. Hover bars for detail.
      </p>

      <div className="relative" style={{ height: 180 }}>
        {grids.map((g, i) => (
          <div key={i} className="absolute left-0 right-0 flex items-center" style={{ bottom: `${(g / yMax) * 100}%` }}>
            <span className="text-[10px] text-muted-foreground w-9 text-right pr-2 shrink-0">{g}mm</span>
            <div className="flex-1 border-t border-border/40" />
          </div>
        ))}

        <div className="absolute left-9 right-0 bottom-0 top-0 flex items-end gap-3 px-2">
          {weeks.map((w, i) => {
            const pct = (w.total_mm / yMax) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-2 py-1.5 rounded whitespace-nowrap z-20 pointer-events-none shadow-lg text-center">
                  <div className="font-bold">{w.week}</div>
                  <div>{w.start} – {w.end}</div>
                  <div className="text-sky-300">Total: {w.total_mm}mm</div>
                  <div className="opacity-70">Avg: {w.avg_mm}mm/day · {w.days} days</div>
                </div>
                {/* Value label above bar */}
                <span className="text-[9px] font-bold text-primary mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {w.total_mm}mm
                </span>
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
                  style={{ height: `${Math.max(pct, w.total_mm > 0 ? 2 : 0)}%`, originY: 1 }}
                  className="w-full rounded-t-md bg-sky-500/60 hover:bg-sky-500 transition-colors cursor-default"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Week labels */}
      <div className="flex gap-3 pl-9 px-2">
        {weeks.map((w, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="text-[9px] font-bold text-foreground">{w.week}</div>
            <div className="text-[8px] text-muted-foreground">{w.start}</div>
          </div>
        ))}
      </div>

      {/* Detail table */}
      <div className="border border-border rounded-lg overflow-hidden mt-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Week</th>
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground hidden sm:table-cell">Period</th>
              <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Total</th>
              <th className="text-right px-3 py-2 font-semibold text-muted-foreground hidden sm:table-cell">Daily avg</th>
              <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Intensity</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => {
              const intensity = w.avg_mm < 2 ? "Low" : w.avg_mm < 8 ? "Moderate" : "High";
              const intensityColor = w.avg_mm < 2 ? "text-muted-foreground" : w.avg_mm < 8 ? "text-amber-600" : "text-sky-600";
              return (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 font-semibold text-foreground">{w.week}</td>
                  <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{w.start} – {w.end}</td>
                  <td className="px-3 py-2 text-right font-bold text-sky-600">{w.total_mm}mm</td>
                  <td className="px-3 py-2 text-right text-muted-foreground hidden sm:table-cell">{w.avg_mm}mm/d</td>
                  <td className={`px-3 py-2 text-right font-semibold ${intensityColor}`}>{intensity}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY CHART
// Clear: sparkline-style with peak highlighting, date range labelled
// ─────────────────────────────────────────────────────────────────────────────
function DailyChart({ days }: { days: DailyEntry[] }) {
  if (!days.length) {
    return <p className="text-muted-foreground text-sm py-12 text-center">No daily data available.</p>;
  }

  const maxVal  = Math.max(...days.map(d => d.mm), 1);
  const total   = days.reduce((s, d) => s + d.mm, 0);
  const avg     = total / days.length;
  const peak    = days.reduce((best, d) => d.mm > best.mm ? d : best, days[0]);
  const yMax    = Math.ceil(maxVal / 5) * 5 || 5;
  const grids   = [0, yMax * 0.5, yMax].map(v => Math.round(v));

  return (
    <div className="space-y-3">
      {/* Summary stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Period total", value: `${total.toFixed(1)}mm`, color: "text-sky-600" },
          { label: "Daily average", value: `${avg.toFixed(2)}mm/day`, color: "text-foreground" },
          { label: "Peak day", value: `${peak.mm.toFixed(1)}mm`, color: "text-blue-600" },
          { label: "Peak date", value: peak.date, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-muted/30 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Daily rainfall mm · {days[0]?.date} → {days[days.length - 1]?.date} · NASA POWER (5-day lag)
      </p>

      {/* Chart */}
      <div className="relative" style={{ height: 180 }}>
        {grids.map((g, i) => (
          <div key={i} className="absolute left-0 right-0 flex items-center" style={{ bottom: `${(g / yMax) * 100}%` }}>
            <span className="text-[10px] text-muted-foreground w-9 text-right pr-2 shrink-0">{g}mm</span>
            <div className="flex-1 border-t border-border/40" />
          </div>
        ))}

        {/* Avg line */}
        <div
          className="absolute left-9 right-0 border-t-2 border-dashed border-amber-400/70 z-10 pointer-events-none"
          style={{ bottom: `${(avg / yMax) * 100}%` }}
        />

        <div className="absolute left-9 right-0 bottom-0 top-0 flex items-end gap-[1px]">
          {days.map((d, i) => {
            const isPeak = d.date === peak.date;
            const pct    = (d.mm / yMax) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col justify-end h-full group relative">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none shadow-lg">
                  <strong>{d.date}</strong>: {d.mm.toFixed(1)}mm
                  {isPeak && <span className="ml-1 text-yellow-300">★ peak</span>}
                </div>
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.008, ease: "easeOut" }}
                  style={{
                    height: `${Math.max(pct, d.mm > 0 ? 1.5 : 0)}%`,
                    originY: 1,
                  }}
                  className={`w-full rounded-t-[1px] cursor-default transition-all hover:brightness-125 ${
                    isPeak ? "bg-blue-500" : d.mm > avg ? "bg-sky-400/80" : "bg-sky-300/50"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Date axis — show first, middle, last */}
      <div className="flex justify-between pl-9 text-[9px] text-muted-foreground">
        <span>{days[0]?.date}</span>
        <span className="flex items-center gap-1">
          <span className="w-4 border-t-2 border-dashed border-amber-400/70 inline-block" />
          avg {avg.toFixed(1)}mm/day
        </span>
        <span>{days[days.length - 1]?.date}</span>
      </div>

      {/* Colour key */}
      <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Peak day</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-400/80 inline-block" /> Above average</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-300/50 inline-block" /> Below average</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-amber-400 inline-block" /> Daily average</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Rainfall() {
  const [selectedDistrict, setSelectedDistrict] = useState("Zomba");
  const [data, setData]           = useState<RainfallData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("annual");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/rainfall`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ districtName: selectedDistrict }),
          signal:  controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Server error ${res.status}`);
        }
        setData(await res.json());
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setError(err.message ?? "Unknown error");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [selectedDistrict]);

  // District pill selector
  const districtSelector = (
    <div className="flex flex-wrap gap-1.5 mb-8">
      {MALAWI_DISTRICTS.map(d => (
        <button
          key={d.name}
          onClick={() => setSelectedDistrict(d.name)}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            d.name === selectedDistrict
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
          }`}
        >
          {d.name}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <main className="container max-w-6xl px-4 py-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">Rainfall Intelligence</h1>
          {districtSelector}
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-foreground font-semibold">Fetching satellite data for {selectedDistrict}</p>
              <p className="text-muted-foreground text-sm mt-1">
                First load fetches 25 years of NASA POWER data — this takes ~30–60 seconds.
                Subsequent loads are instant from cache.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <main className="container max-w-6xl px-4 py-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">Rainfall Intelligence</h1>
          {districtSelector}
          <Card>
            <CardContent className="py-12 text-center text-destructive font-medium">
              {error ?? "No data returned from server."}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const forecast         = Number(data.annualForecastMm)  || 0;
  const confidence       = Number(data.annualConfidence)  || 0;
  const avgRainfall      = Number(data.avgAnnualRainfall) || 0;
  const historicalYears  = data.historicalYears  ?? [];
  const historicalValues = (data.historicalValues ?? []).map(Number);
  const monthlyRaw       = data.monthlyDistribution ?? [];
  const dailyData        = (data.dailyData ?? []).map(d => ({ ...d, mm: Number(d.mm) }));
  const weeklyData       = (data.weeklyData ?? []).map(w => ({ ...w, total_mm: Number(w.total_mm), avg_mm: Number(w.avg_mm) }));
  const risks            = data.risks ?? [];
  const fertilizerCal    = data.fertilizerCalendar ?? [];
  const cropSuitability  = data.cropSuitability   ?? [];

  const monthlyMap: Record<string, number> = {};
  monthlyRaw.forEach((item: MonthlyEntry) => { monthlyMap[item.month] = Number(item.mm); });
  const maxMonthly = Math.max(...MONTHS_SHORT.map(m => monthlyMap[m] ?? 0), 1);

  const tabs: { id: TabId; label: string; icon: any; count?: string }[] = [
    { id: "annual",  label: "Annual",  icon: TrendingUp, count: `${historicalYears.length} yrs` },
    { id: "monthly", label: "Monthly", icon: BarChart3,  count: "12 mo" },
    { id: "weekly",  label: "Weekly",  icon: Calendar,   count: weeklyData.length ? `${weeklyData.length} wks` : undefined },
    { id: "daily",   label: "Daily",   icon: CloudRain,  count: dailyData.length ? `${dailyData.length}d` : undefined },
  ];

  const color = bandColor(data.band);

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container max-w-6xl px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Rainfall Intelligence
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2 flex-wrap text-sm">
                <SourceBadge source={data.annualSource} />
                <span>{data.annualSource}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black" style={{ color }}>{data.band}</span>
              <span className="text-muted-foreground text-sm">zone</span>
            </div>
          </div>
        </motion.div>

        {districtSelector}

        {/* ── Top stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

          {/* Season card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="col-span-2"
          >
            <Card className={`h-full border-l-4`} style={{ borderLeftColor: color }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      {data.seasonLabel}
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{data.seasonPeriod}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant={data.inRainySeason ? "default" : "secondary"}>
                        {data.inRainySeason ? "🌧 Rainy season active" : "☀️ Dry season"}
                      </Badge>
                      <Badge variant="outline" style={{ borderColor: color, color }}>{data.band}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">Rainy season only</p>
                    <p className="text-xl font-black text-sky-600">{data.seasonTotalMm}mm</p>
                    <p className="text-[10px] text-muted-foreground">Nov–May estimate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Annual forecast card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Full year forecast
                </p>
                <p className="text-[10px] text-muted-foreground mb-1">Jan–Dec (EWMA)</p>
                <p className="text-2xl font-black text-foreground">{forecast}mm</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${confidence}%`, backgroundColor: confidenceColor(confidence) }}
                    />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: confidenceColor(confidence) }}>
                    {confidence}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {confidence >= 80 ? "High confidence (satellite)" : confidence >= 65 ? "Medium confidence" : "Low confidence — satellite unavailable"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live 7-day card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="h-full">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Live 7-day
                </p>
                <p className="text-[10px] text-muted-foreground mb-1">Open-Meteo forecast</p>
                <p className="text-2xl font-black text-foreground">
                  {data.live7DayMm != null ? `${data.live7DayMm}mm` : "N/A"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {data.live7DayDescription ?? "Live forecast unavailable"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* ── Risks ── */}
        {risks.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="mb-6">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-bold">Season Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {risks.map((r, i) => (
                  <div key={i} className={`flex gap-3 items-start p-3 rounded-lg text-sm border ${
                    r.level === "ok"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                      : r.level === "danger"
                      ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
                      : "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
                  }`}>
                    <span className="text-base shrink-0">{r.icon}</span>
                    <span>{r.message}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic pt-1">{data.bandDescription}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Chart tabs ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">

              {/* Tab bar */}
              <div className="flex gap-0 mb-6 border border-border rounded-lg overflow-hidden divide-x divide-border">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex flex-col items-center py-2.5 px-2 text-xs font-semibold transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mb-1" />
                    <span>{tab.label}</span>
                    {tab.count && (
                      <span className={`text-[9px] mt-0.5 ${activeTab === tab.id ? "opacity-70" : "text-muted-foreground"}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeTab === "annual" && (
                    <AnnualChart
                      years={historicalYears}
                      values={historicalValues}
                      forecast={forecast}
                      avg={avgRainfall}
                    />
                  )}
                  {activeTab === "monthly" && (
                    <MonthlyChart
                      monthlyMap={monthlyMap}
                      maxMonthly={maxMonthly}
                      source={data.monthlySource}
                    />
                  )}
                  {activeTab === "weekly" && <WeeklyChart weeks={weeklyData} />}
                  {activeTab === "daily"  && <DailyChart  days={dailyData} />}
                </motion.div>
              </AnimatePresence>

            </CardContent>
          </Card>
        </motion.div>

        {/* ── Bottom cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Crop suitability */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">
                  Crop Suitability — {forecast}mm/yr
                </CardTitle>
                <p className="text-xs text-muted-foreground">Based on EWMA annual forecast</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {cropSuitability.length > 0 ? cropSuitability.map(c => (
                  <div key={c.crop} className="flex items-center gap-3">
                    <span className="text-xl w-7 shrink-0">{c.emoji}</span>
                    <span className="text-sm flex-1 font-medium">{c.crop}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${c.suitability}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.35 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                    <span className={`text-xs font-bold w-9 text-right ${
                      c.suitability >= 75 ? "text-emerald-600" :
                      c.suitability >= 50 ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {c.suitability}%
                    </span>
                  </div>
                )) : (
                  <p className="text-muted-foreground text-sm">No suitability data.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Fertilizer calendar */}
          {fertilizerCal.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">
                    Fertilizer Calendar — {data.seasonLabel}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Timing recommendations based on rainfall forecast</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fertilizerCal.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex items-center justify-center h-6 min-w-[3.5rem] rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {item.month}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{item.action}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

        </div>

      </main>
    </div>
  );
}
