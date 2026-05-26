// src/pages/admin/ui.tsx
// Reusable micro-components shared across all admin tab panels.

import { RefreshCw, XCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import logo        from "@/assets/logo.jpeg";

// ── Sparkline ─────────────────────────────────────────────────────────────────
export function Spark({
  data, className = "text-primary",
}: {
  data: number[];
  className?: string;
}) {
  const h = 32, w = 90;
  if (!data.length || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = range === 0 ? h / 2 : h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className}>
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
export function MiniBar({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-16 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className={`w-full rounded-t-sm ${i === data.length - 1 ? "bg-primary" : "bg-primary/30"}`}
            style={{ height: `${(d.count / max) * 56}px` }}
          />
          <span className="text-[9px] text-muted-foreground -rotate-45 origin-top whitespace-nowrap">
            {d.month}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Status dot ────────────────────────────────────────────────────────────────
export function StatusDot({ status }: { status: string }) {
  const cls =
    status === "active"  ? "bg-primary shadow-[0_0_6px_hsl(var(--primary))]"
    : status === "idle"  ? "bg-golden  shadow-[0_0_6px_hsl(var(--golden))]"
    : "bg-muted-foreground";
  return <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${cls}`} />;
}

// ── Full-panel loader ─────────────────────────────────────────────────────────
export function Loader() {
  return (
    <div className="flex items-center justify-center py-12 gap-3">
      <img src={logo} alt="" className="h-8 w-8 rounded-lg animate-pulse" />
      <span className="text-sm text-muted-foreground">Loading…</span>
    </div>
  );
}

// ── Error message with retry ──────────────────────────────────────────────────
export function ErrorMsg({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="text-sm text-destructive">{msg}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
      </Button>
    </div>
  );
}

// ── Alert badge ───────────────────────────────────────────────────────────────
export function AlertBadge({ level }: { level: string }) {
  if (level === "error")   return <Badge variant="destructive" className="text-[10px]">Error</Badge>;
  if (level === "warning") return <Badge className="bg-golden text-golden-foreground text-[10px]">Warning</Badge>;
  if (level === "success") return <Badge className="bg-primary text-primary-foreground text-[10px]">OK</Badge>;
  return <Badge variant="outline" className="text-[10px]">Info</Badge>;
}

// ── Alert icon ────────────────────────────────────────────────────────────────
export function AlertIcon({ level }: { level: string }) {
  if (level === "error")   return <XCircle       className="h-4 w-4 text-destructive      shrink-0" />;
  if (level === "warning") return <AlertTriangle  className="h-4 w-4 text-golden          shrink-0" />;
  if (level === "success") return <CheckCircle2   className="h-4 w-4 text-primary         shrink-0" />;
  return                          <Info           className="h-4 w-4 text-muted-foreground shrink-0" />;
}

// ── Score colour helper ───────────────────────────────────────────────────────
export function scoreColor(s: number) {
  return s >= 90 ? "text-primary" : s >= 75 ? "text-golden" : "text-destructive";
}
