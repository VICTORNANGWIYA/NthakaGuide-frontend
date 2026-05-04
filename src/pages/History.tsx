import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import NavHeader from "@/components/NavHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trash2, Calendar, MapPin, Sprout, FlaskConical,
  Droplets, Thermometer, CloudRain, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Leaf, RotateCcw,
  ShieldAlert, Clock, Beaker,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpeg";

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FertilizerPlanItem {
  type:            string;
  applicationRate: string;
  timing:          string;
  notes?:          string;
  alternative?:    string | null;
  confidence?:     string | null;
  products?:       string[];
}

interface FertilizerPlan {
  items?:         FertilizerPlanItem[];
  warnings?:      string[];
  organicAdvice?: string;
  confidence?: {
    score:   number;
    label:   string;
    message: string;
  };
  // legacy flat fields
  basal?:           string;
  basal_rate?:      string;
  topdress?:        string;
  topdress_rate?:   string;
  topdress_timing?: string;
  notes?:           string;
}

interface RotationAdvice {
  type:           "warning" | "positive" | "info";
  message:        string;
  recommendation: string;
}

interface CropEntry {
  crop:           string;
  emoji:          string;
  score:          number;
  confidence:     number;
  season:         string;
  reason:         string;
  fertilizerPlan: FertilizerPlan;
  rotationAdvice?: RotationAdvice | null;
}

interface SoilAlert {
  type:    string;
  message: string;
  icon?:   string;
}

interface HistoryItem {
  id:                string;
  district:          string;
  climate_zone:      string | null;
  input_mode:        string;
  created_at:        string;
  nitrogen:          number | null;
  phosphorus:        number | null;
  potassium:         number | null;
  ph:                number | null;
  moisture:          number | null;
  temperature:       number | null;
  organic_matter:    number | null;
  rainfall_mm:       number | null;
  rainfall_band:     string | null;
  rainfall_category: string | null;
  recommended_crop:  string;
  crop_score:        number | null;
  crop_confidence:   number | null;
  crop_season:       string | null;
  fertilizer_type:   string | null;
  land_use?:         string | null;
  previous_crop?:    string | null;
  all_crops:         CropEntry[];
  soil_alerts:       SoilAlert[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function modeBadge(mode: string) {
  if (mode === "lab")   return { label: "Lab Data",         cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
  if (mode === "field") return { label: "Field Assessment", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
  return                       { label: "Mixed",            cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" };
}

function alertStyle(type: string) {
  if (type === "danger")  return "bg-destructive/5 text-destructive border-destructive/20";
  if (type === "warning") return "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
  if (type === "ok")      return "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
  return "bg-primary/5 text-primary border-primary/20";
}

function AlertIcon({ type }: { type: string }) {
  if (type === "danger" || type === "warning")
    return <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />;
  return <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />;
}

function rainfallBadgeVariant(cat: string | null) {
  if (cat === "High" || cat === "Very High") return "default";
  if (cat === "Low"  || cat === "Very Low")  return "destructive";
  return "secondary";
}

// ─────────────────────────────────────────────────────────────────────────────
//  FERTILIZER PLAN RENDERER  (shared sub-component)
// ─────────────────────────────────────────────────────────────────────────────

function FertilizerPlanCard({ plan }: { plan: FertilizerPlan }) {
  const hasItems  = (plan.items ?? []).length > 0;
  const hasLegacy = !!(plan.basal || plan.topdress);

  if (!hasItems && !hasLegacy) return null;

  return (
    <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2.5">

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <FlaskConical className="h-3 w-3" /> Fertilizer Plan
        </p>
        {plan.confidence && (
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
            plan.confidence.score >= 85
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : plan.confidence.score >= 70
              ? "bg-primary/10 text-primary"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
          }`}>
            {plan.confidence.label}
          </span>
        )}
      </div>

      {/* Rich items */}
      {hasItems && (
        <div className="space-y-2">
          {plan.items!.map((item, j) => (
            <div
              key={j}
              className="text-xs border-t border-border/60 pt-2 first:border-0 first:pt-0 space-y-1"
            >
              {/* Timing + rate row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-medium">
                  <Clock className="h-2.5 w-2.5" />
                  {item.timing}
                </span>
                <span className="text-primary font-semibold text-[10px] tabular-nums">
                  {item.applicationRate}
                </span>
              </div>

              {/* Action */}
              <p className="font-medium text-foreground leading-snug">{item.type}</p>

              {/* Notes */}
              {item.notes && (
                <p className="text-muted-foreground leading-relaxed">{item.notes}</p>
              )}

              {/* Alternative */}
              {item.alternative && (
                <p className="text-muted-foreground italic">Alt: {item.alternative}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legacy flat fields fallback */}
      {!hasItems && hasLegacy && (
        <div className="space-y-1 text-xs">
          {plan.basal && (
            <p className="text-foreground">
              <span className="text-muted-foreground">Basal:</span> {plan.basal}
              {plan.basal_rate && <span className="text-muted-foreground"> · {plan.basal_rate}</span>}
            </p>
          )}
          {plan.topdress && (
            <p className="text-foreground">
              <span className="text-muted-foreground">Top-dress:</span> {plan.topdress}
              {plan.topdress_rate && <span className="text-muted-foreground"> · {plan.topdress_rate}</span>}
            </p>
          )}
          {plan.topdress_timing && (
            <p className="text-muted-foreground">{plan.topdress_timing}</p>
          )}
          {plan.notes && (
            <p className="text-muted-foreground border-t border-border pt-1">{plan.notes}</p>
          )}
        </div>
      )}

      {/* Organic advice */}
      {plan.organicAdvice && (
        <div className="flex gap-1.5 items-start border-t border-border pt-2">
          <Leaf className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-green-800 dark:text-green-300 leading-relaxed">
            {plan.organicAdvice}
          </p>
        </div>
      )}

      {/* Warnings */}
      {(plan.warnings ?? []).length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          {plan.warnings!.map((w, k) => (
            <div key={k} className="flex gap-1.5 items-start">
              <ShieldAlert className="h-3 w-3 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-yellow-800 dark:text-yellow-300 leading-relaxed">{w}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROTATION ADVICE RENDERER
// ─────────────────────────────────────────────────────────────────────────────

function RotationCard({ advice }: { advice: RotationAdvice }) {
  const styles = {
    warning:  "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
    positive: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    info:     "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  };
  const textStyles = {
    warning:  "text-yellow-800 dark:text-yellow-300",
    positive: "text-green-800 dark:text-green-300",
    info:     "text-blue-800 dark:text-blue-300",
  };
  const labels = {
    warning:  "⚠ Rotation Warning",
    positive: "✓ Good Rotation",
    info:     "ℹ Rotation Info",
  };

  return (
    <div className={`rounded-md border p-2.5 space-y-1 ${styles[advice.type]}`}>
      <p className={`text-[10px] font-semibold flex items-center gap-1 ${textStyles[advice.type]}`}>
        <RotateCcw className="h-2.5 w-2.5" />
        {labels[advice.type]}
      </p>
      <p className={`text-[10px] leading-relaxed ${textStyles[advice.type]}`}>{advice.message}</p>
      <p className="text-[10px] text-muted-foreground italic">{advice.recommendation}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SOIL VALUE PILL
// ─────────────────────────────────────────────────────────────────────────────

function SoilPill({
  label, value, good,
}: { label: string; value: string; good: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
      good
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    }`}>
      {label}: {value}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function History() {
  const { user, token } = useAuth();
  const { toast }       = useToast();

  const [history,  setHistory]  = useState<HistoryItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user || !token) { setLoading(false); return; }
    try {
      const res  = await fetch("http://localhost:5000/analysis/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch history");
      setHistory(Array.isArray(data) ? data : (data.items ?? []));
    } catch (err: any) {
      toast({ title: "Error loading history", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [token]);

  const handleDelete = async (id: string) => {
    try {
      const res  = await fetch(`http://localhost:5000/analysis/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHistory(prev => prev.filter(h => h.id !== id));
      toast({ title: "Deleted", description: "Analysis record removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="container max-w-5xl px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">
            Analysis History
          </h1>
          <p className="text-muted-foreground mb-8">
            Your previous soil analyses and crop recommendations
          </p>

          {/* ── Loading ──────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your analyses...</p>
            </div>

          ) : history.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center space-y-3">
                <img
                  src={logo}
                  alt="NthakaGuide logo"
                  className="h-14 w-14 rounded-xl shadow-md mx-auto"
                />
                <p className="text-muted-foreground text-lg font-medium">No analyses yet.</p>
                <p className="text-sm text-muted-foreground">
                  Run your first soil analysis to see results here.
                </p>
              </CardContent>
            </Card>

          ) : (
            <div className="space-y-5">
              {history.map((item, i) => {
                const mode   = modeBadge(item.input_mode);
                const isOpen = expanded === item.id;
                const crops  = item.all_crops  ?? [];
                const alerts = item.soil_alerts ?? [];

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow border-border">
                      <CardContent className="p-0">

                        {/* ══ CARD HEADER ══════════════════════════════════ */}
                        <div className="p-4 sm:p-5">

                          {/* Meta row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${mode.cls}`}>
                                {mode.label}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" /> {item.district}
                                {item.climate_zone && (
                                  <span className="opacity-60">· {item.climate_zone}</span>
                                )}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(item.created_at).toLocaleDateString("en-GB", {
                                  day: "numeric", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => setExpanded(isOpen ? null : item.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title={isOpen ? "Collapse" : "Expand"}
                              >
                                {isOpen
                                  ? <ChevronUp className="h-4 w-4"/>
                                  : <ChevronDown className="h-4 w-4"/>}
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/5"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Top recommended crop */}
                          <div className="flex items-center gap-3 mt-3">
                            <img
                              src={logo}
                              alt="NthakaGuide logo"
                              className="h-9 w-9 rounded-lg shadow-sm shrink-0"
                            />
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="text-base font-bold text-foreground truncate">
                                {item.recommended_crop}
                              </span>
                              {item.crop_score !== null && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {item.crop_score}% match
                                </Badge>
                              )}
                              {item.crop_season && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {item.crop_season}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Key metric pills */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs">
                            {item.fertilizer_type && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <FlaskConical className="h-3 w-3" /> {item.fertilizer_type}
                              </span>
                            )}
                            {item.rainfall_mm !== null && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <CloudRain className="h-3 w-3" /> {item.rainfall_mm}mm
                                {item.rainfall_band && (
                                  <Badge
                                    variant={rainfallBadgeVariant(item.rainfall_category)}
                                    className="text-[10px] px-1.5 py-0 ml-1"
                                  >
                                    {item.rainfall_band}
                                  </Badge>
                                )}
                              </span>
                            )}
                            {item.land_use && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Sprout className="h-3 w-3" /> {item.land_use}
                              </span>
                            )}
                            {item.previous_crop && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <RotateCcw className="h-3 w-3" /> prev: {item.previous_crop}
                              </span>
                            )}
                          </div>

                          {/* Soil inputs mini row */}
                          {item.nitrogen !== null && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                              {item.nitrogen      !== null && (
                                <SoilPill label="N"    value={`${item.nitrogen} mg/kg`}  good={item.nitrogen >= 60} />
                              )}
                              {item.phosphorus    !== null && (
                                <SoilPill label="P"    value={`${item.phosphorus} mg/kg`} good={item.phosphorus >= 30} />
                              )}
                              {item.potassium     !== null && (
                                <SoilPill label="K"    value={`${item.potassium} mg/kg`}  good={item.potassium >= 80} />
                              )}
                              {item.ph            !== null && (
                                <SoilPill label="pH"   value={`${item.ph}`}               good={item.ph >= 6.0 && item.ph <= 7.5} />
                              )}
                              {item.moisture      !== null && (
                                <SoilPill label="Mst"  value={`${item.moisture}%`}         good={item.moisture >= 30 && item.moisture <= 70} />
                              )}
                              {item.temperature   !== null && (
                                <SoilPill label="Temp" value={`${item.temperature}°C`}     good />
                              )}
                              {item.organic_matter !== null && (
                                <SoilPill label="OM"   value={`${item.organic_matter}%`}   good={item.organic_matter >= 2.0} />
                              )}
                            </div>
                          )}
                        </div>

                        {/* ══ EXPANDED DETAIL PANEL ══════════════════════ */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border bg-muted/20 px-4 sm:px-5 py-5 space-y-6">

                                {/* ── Soil alerts ──────────────────────── */}
                                {alerts.length > 0 && (
                                  <section>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                      Soil Health Alerts
                                    </h3>
                                    <div className="space-y-1.5">
                                      {alerts.map((alert, j) => (
                                        <div
                                          key={j}
                                          className={`flex gap-2 items-start p-2 rounded-md text-xs border ${alertStyle(alert.type)}`}
                                        >
                                          <AlertIcon type={alert.type} />
                                          <span>{alert.message}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </section>
                                )}

                                {/* ── All crops ────────────────────────── */}
                                {crops.length > 0 && (
                                  <section>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                                      All {crops.length} Crop Recommendations
                                    </h3>
                                    <div className="space-y-3">
                                      {crops.map((crop, j) => {
                                        const hasFert = !!(
                                          (crop.fertilizerPlan?.items ?? []).length > 0 ||
                                          crop.fertilizerPlan?.basal ||
                                          crop.fertilizerPlan?.topdress
                                        );

                                        return (
                                          <div
                                            key={j}
                                            className={`rounded-lg border p-3 space-y-3 ${
                                              j === 0
                                                ? "border-primary/30 bg-primary/5"
                                                : "border-border bg-background"
                                            }`}
                                          >
                                            {/* Crop header */}
                                            <div className="flex items-center gap-3">
                                              <span className="text-2xl">{crop.emoji}</span>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                  <span className="font-bold text-foreground">
                                                    {crop.crop}
                                                  </span>
                                                  {j === 0 && (
                                                    <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                                                      Top Pick
                                                    </Badge>
                                                  )}
                                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                    {crop.season}
                                                  </Badge>
                                                </div>
                                                <Progress value={crop.score} className="h-1.5" />
                                              </div>
                                              <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                                                {crop.score}%
                                              </span>
                                            </div>

                                            {/* Reason */}
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                              {crop.reason}
                                            </p>

                                            {/* Fertilizer + rotation in a responsive grid */}
                                            {(hasFert || crop.rotationAdvice) && (
                                              <div className={`grid gap-2 ${
                                                hasFert && crop.rotationAdvice
                                                  ? "grid-cols-1 sm:grid-cols-2"
                                                  : "grid-cols-1"
                                              }`}>
                                                {hasFert && (
                                                  <FertilizerPlanCard plan={crop.fertilizerPlan} />
                                                )}
                                                {crop.rotationAdvice && (
                                                  <RotationCard advice={crop.rotationAdvice} />
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </section>
                                )}

                                {/* ── Full soil inputs grid ─────────────── */}
                                {item.nitrogen !== null && (
                                  <section>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                      Soil Inputs Used
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {([
                                        { label: "Nitrogen",       value: item.nitrogen,       unit: "mg/kg", good: item.nitrogen      >= 60 },
                                        { label: "Phosphorus",     value: item.phosphorus,     unit: "mg/kg", good: item.phosphorus    >= 30 },
                                        { label: "Potassium",      value: item.potassium,      unit: "mg/kg", good: item.potassium     >= 80 },
                                        { label: "pH",             value: item.ph,             unit: "",      good: item.ph !== null && item.ph >= 6.0 && item.ph <= 7.5 },
                                        { label: "Moisture",       value: item.moisture,       unit: "%",     good: item.moisture !== null && item.moisture >= 30 && item.moisture <= 70 },
                                        { label: "Temperature",    value: item.temperature,    unit: "°C",    good: true },
                                        { label: "Organic Matter", value: item.organic_matter, unit: "%",     good: item.organic_matter !== null && item.organic_matter >= 2.0 },
                                        { label: "Rainfall",       value: item.rainfall_mm,    unit: "mm/yr", good: true },
                                      ] as const).filter(f => f.value !== null).map(f => (
                                        <div
                                          key={f.label}
                                          className={`rounded-md p-2.5 border ${
                                            f.good
                                              ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                                              : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800"
                                          }`}
                                        >
                                          <p className={`text-[9px] font-semibold uppercase tracking-wide ${
                                            f.good
                                              ? "text-green-700 dark:text-green-400"
                                              : "text-yellow-700 dark:text-yellow-400"
                                          }`}>
                                            {f.label}
                                          </p>
                                          <p className="text-sm font-bold text-foreground mt-0.5">
                                            {f.value}{f.unit}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </section>
                                )}

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
}