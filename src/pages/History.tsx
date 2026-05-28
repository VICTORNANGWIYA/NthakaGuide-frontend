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
    return <AlertTriangle className="h-4 w-4 shrink-0" />;
  return <CheckCircle className="h-4 w-4 shrink-0" />;
}

function rainfallBadgeVariant(cat: string | null) {
  if (cat === "High" || cat === "Very High") return "default";
  if (cat === "Low"  || cat === "Very Low")  return "destructive";
  return "secondary";
}



function FertilizerPlanCard({ plan }: { plan: FertilizerPlan }) {
  const hasItems  = (plan.items ?? []).length > 0;
  const hasLegacy = !!(plan.basal || plan.topdress);

  if (!hasItems && !hasLegacy) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Beaker className="h-4 w-4 text-primary shrink-0" />
          {/* ↑ font-semibold, text-base for clear label */}
          <span className="text-base font-semibold text-foreground">Fertilizer Plan</span>
        </div>

        {plan.confidence && (
          <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
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

      {/* Structured items */}
      {hasItems && (
        <div className="space-y-2">
          {plan.items!.map((item, j) => (
            <div key={j} className="rounded-md border bg-background p-3 space-y-1">

              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Timing chip */}
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {/* text-sm → text-base for readability */}
                  <span className="text-sm font-medium text-foreground">{item.timing}</span>
                </div>
                {/* Rate */}
                <span className="text-sm font-semibold text-primary">{item.applicationRate}</span>
              </div>

              {/* Type — the most important label, bump up */}
              <p className="text-base font-semibold text-foreground">{item.type}</p>

              {item.notes && (
                <p className="text-sm text-muted-foreground leading-relaxed">{item.notes}</p>
              )}

              {item.alternative && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Alt:</span> {item.alternative}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legacy basal/topdress layout */}
      {!hasItems && hasLegacy && (
        <div className="space-y-1.5 text-sm">
          {plan.basal && (
            <p className="text-foreground">
              <span className="font-semibold">Basal:</span> {plan.basal}
              {plan.basal_rate && <span className="text-muted-foreground"> · {plan.basal_rate}</span>}
            </p>
          )}
          {plan.topdress && (
            <p className="text-foreground">
              <span className="font-semibold">Top-dress:</span> {plan.topdress}
              {plan.topdress_rate && <span className="text-muted-foreground"> · {plan.topdress_rate}</span>}
            </p>
          )}
          {plan.topdress_timing && (
            <p className="text-sm text-muted-foreground">{plan.topdress_timing}</p>
          )}
          {plan.notes && (
            <p className="text-sm text-muted-foreground">{plan.notes}</p>
          )}
        </div>
      )}

      {/* Organic advice */}
      {plan.organicAdvice && (
        <div className="flex gap-2 items-start rounded-md bg-green-50 dark:bg-green-900/20 p-3">
          <Leaf className="h-4 w-4 text-green-700 dark:text-green-400 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800 dark:text-green-300 leading-relaxed">
            {plan.organicAdvice}
          </p>
        </div>
      )}

      {/* Warnings */}
      {(plan.warnings ?? []).length > 0 && (
        <div className="space-y-1.5">
          {plan.warnings!.map((w, k) => (
            <div key={k} className="flex gap-2 items-start text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{w}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


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
    <div className={`rounded-lg border p-3 space-y-1.5 ${styles[advice.type]}`}>
      {/* Label — font-semibold, text-sm keeps it tidy */}
      <p className={`text-sm font-semibold ${textStyles[advice.type]}`}>
        {labels[advice.type]}
      </p>
      {/* Body copy — text-sm with relaxed line height for legibility */}
      <p className={`text-sm leading-relaxed ${textStyles[advice.type]}`}>{advice.message}</p>
      <p className={`text-sm leading-relaxed ${textStyles[advice.type]}`}>{advice.recommendation}</p>
    </div>
  );
}



function SoilPill({
  label, value, good,
}: { label: string; value: string; good: boolean }) {
  return (
    /* text-xs → text-sm; explicit foreground colors so contrast is guaranteed */
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium border ${
      good
        ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
        : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
    }`}>
      {label}: {value}
    </span>
  );
}



export default function History() {
  const { user, token } = useAuth();
  const { toast }       = useToast();

  const [history,  setHistory]  = useState<HistoryItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user || !token) { setLoading(false); return; }
    try {
      const res  = await fetch("https://nthakaguide-backend.onrender.com/analysis/", {
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
      const res  = await fetch(`https://nthakaguide-backend.onrender.com/analysis/${id}`, {
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

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="container mx-auto max-w-3xl px-4 py-8">

        {/* Page heading */}
        <div className="mb-8 space-y-1">
          {/* text-3xl + font-bold for a clear, professional page title */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Analysis History
          </h1>
          {/* text-base replaces tiny muted subtitles */}
          <p className="text-base text-muted-foreground">
            Your previous soil analyses and crop recommendations
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-base text-muted-foreground">Loading your analyses…</p>
          </div>

        ) : history.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <Sprout className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-semibold text-foreground">No analyses yet.</p>
              <p className="text-base text-muted-foreground text-center">
                Run your first soil analysis to see results here.
              </p>
            </CardContent>
          </Card>

        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-4">
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
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="overflow-hidden">

                      {/* ── Card header row ──────────────────────────────── */}
                      <div className="flex flex-col gap-3 p-5">

                        {/* Row 1 – meta: mode badge + district + date */}
                        <div className="flex items-start justify-between gap-3 flex-wrap">

                          <div className="flex flex-col gap-1.5 min-w-0">
                            {/* Mode badge */}
                            <span className={`self-start text-xs font-semibold px-2.5 py-0.5 rounded-full ${mode.cls}`}>
                              {mode.label}
                            </span>

                            {/* District + climate zone */}
                            {/* text-base → text-lg for prominence */}
                            <span className="text-base font-semibold text-foreground flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                              {item.district}
                              {item.climate_zone && (
                                <span className="text-sm font-normal text-muted-foreground">
                                  · {item.climate_zone}
                                </span>
                              )}
                            </span>

                            {/* Date */}
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              {new Date(item.created_at).toLocaleDateString("en-GB", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => setExpanded(isOpen ? null : item.id)}
                              className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                              title={isOpen ? "Collapse" : "Expand"}
                            >
                              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="h-9 w-9 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/5"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>

                        {/* Row 2 – recommended crop headline */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Sprout className="h-5 w-5 text-primary shrink-0" />
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Crop name — prominent */}
                            <span className="text-lg font-bold text-foreground">{item.recommended_crop}</span>
                            {item.crop_score !== null && (
                              <span className="text-sm font-semibold text-primary">
                                {item.crop_score}% match
                              </span>
                            )}
                            {item.crop_season && (
                              <span className="text-sm text-muted-foreground">{item.crop_season}</span>
                            )}
                          </div>
                        </div>

                        {/* Row 3 – quick chips */}
                        <div className="flex items-center gap-2 flex-wrap text-sm text-foreground">
                          {item.fertilizer_type && (
                            <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                              <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
                              {item.fertilizer_type}
                            </span>
                          )}
                          {item.rainfall_mm !== null && (
                            <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                              <CloudRain className="h-3.5 w-3.5 text-muted-foreground" />
                              {item.rainfall_mm}mm
                              {item.rainfall_band && (
                                <Badge variant={rainfallBadgeVariant(item.rainfall_category)} className="text-xs">
                                  {item.rainfall_band}
                                </Badge>
                              )}
                            </span>
                          )}
                          {item.land_use && (
                            <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                              <Leaf className="h-3.5 w-3.5 text-muted-foreground" />
                              {item.land_use}
                            </span>
                          )}
                          {item.previous_crop && (
                            <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                              <RotateCcw className="h-3.5 w-3.5" />
                              prev: {item.previous_crop}
                            </span>
                          )}
                        </div>

                        {/* Row 4 – soil pills (only when data available) */}
                        {item.nitrogen !== null && (
                          <div className="flex flex-wrap gap-2">
                            {item.nitrogen      !== null && <SoilPill label="N"    value={`${item.nitrogen}`}       good={item.nitrogen      >= 60} />}
                            {item.phosphorus    !== null && <SoilPill label="P"    value={`${item.phosphorus}`}     good={item.phosphorus    >= 30} />}
                            {item.potassium     !== null && <SoilPill label="K"    value={`${item.potassium}`}      good={item.potassium     >= 80} />}
                            {item.ph            !== null && <SoilPill label="pH"   value={`${item.ph}`}             good={item.ph >= 6.0 && item.ph <= 7.5} />}
                            {item.moisture      !== null && <SoilPill label="Mst"  value={`${item.moisture}%`}      good={item.moisture >= 30 && item.moisture <= 70} />}
                            {item.temperature   !== null && <SoilPill label="Tmp"  value={`${item.temperature}°C`} good={true} />}
                            {item.organic_matter!== null && <SoilPill label="OM"   value={`${item.organic_matter}%`} good={item.organic_matter >= 2.0} />}
                          </div>
                        )}
                      </div>

                      {/* ── Expandable detail section ─────────────────────── */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="detail"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="border-t px-5 pb-5 pt-4 space-y-5">

                              {/* Soil health alerts */}
                              {alerts.length > 0 && (
                                <section className="space-y-2">
                                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-destructive" />
                                    Soil Health Alerts
                                  </h3>
                                  <div className="space-y-2">
                                    {alerts.map((alert, j) => (
                                      <div
                                        key={j}
                                        className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm leading-relaxed ${alertStyle(alert.type)}`}
                                      >
                                        <AlertIcon type={alert.type} />
                                        {/* text-sm with leading-relaxed for scan-friendly alert text */}
                                        <span className="text-sm leading-relaxed">{alert.message}</span>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              )}

                              {/* All crop recommendations */}
                              {crops.length > 0 && (
                                <section className="space-y-3">
                                  <h3 className="text-base font-semibold text-foreground">
                                    All {crops.length} Crop Recommendations
                                  </h3>

                                  <div className="space-y-4">
                                    {crops.map((crop, j) => {
                                      const hasFert = !!(
                                        (crop.fertilizerPlan?.items ?? []).length > 0 ||
                                        crop.fertilizerPlan?.basal ||
                                        crop.fertilizerPlan?.topdress
                                      );

                                      return (
                                        <div key={j} className="rounded-lg border bg-card p-4 space-y-3">

                                          {/* Crop header */}
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                              <span className="text-2xl">{crop.emoji}</span>
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  {/* Crop name — text-base font-bold */}
                                                  <span className="text-base font-bold text-foreground">
                                                    {crop.crop}
                                                  </span>
                                                  {j === 0 && (
                                                    <Badge className="text-xs bg-primary text-primary-foreground">
                                                      Top Pick
                                                    </Badge>
                                                  )}
                                                  {/* Season */}
                                                  <span className="text-sm text-muted-foreground">{crop.season}</span>
                                                </div>
                                                {/* Score progress bar */}
                                                <div className="mt-1.5 flex items-center gap-2">
                                                  <Progress value={crop.score} className="h-1.5 w-24" />
                                                  <span className="text-xs font-medium text-muted-foreground">{crop.score}%</span>
                                                </div>
                                              </div>
                                            </div>
                                            {/* Score badge */}
                                            <span className="text-base font-bold text-primary shrink-0">
                                              {crop.score}%
                                            </span>
                                          </div>

                                          {/* Reason — text-sm with relaxed leading */}
                                          <p className="text-sm leading-relaxed text-muted-foreground">
                                            {crop.reason}
                                          </p>

                                          {/* Fertilizer + rotation */}
                                          {(hasFert || crop.rotationAdvice) && (
                                            <div className="space-y-2">
                                              {hasFert && <FertilizerPlanCard plan={crop.fertilizerPlan} />}
                                              {crop.rotationAdvice && <RotationCard advice={crop.rotationAdvice} />}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </section>
                              )}

                              {/* Soil inputs table */}
                              {item.nitrogen !== null && (
                                <section className="space-y-2">
                                  <h3 className="text-base font-semibold text-foreground">Soil Inputs Used</h3>

                                  <div className="rounded-lg border divide-y text-sm">
                                    {([
                                      { label: "Nitrogen",       value: item.nitrogen,       unit: "mg/kg", good: item.nitrogen      >= 60 },
                                      { label: "Phosphorus",     value: item.phosphorus,     unit: "mg/kg", good: (item.phosphorus ?? 0) >= 30 },
                                      { label: "Potassium",      value: item.potassium,      unit: "mg/kg", good: (item.potassium  ?? 0) >= 80 },
                                      { label: "pH",             value: item.ph,             unit: "",      good: item.ph !== null && item.ph >= 6.0 && item.ph <= 7.5 },
                                      { label: "Moisture",       value: item.moisture,       unit: "%",     good: item.moisture !== null && item.moisture >= 30 && item.moisture <= 70 },
                                      { label: "Temperature",    value: item.temperature,    unit: "°C",    good: true },
                                      { label: "Organic Matter", value: item.organic_matter, unit: "%",     good: item.organic_matter !== null && item.organic_matter >= 2.0 },
                                      { label: "Rainfall",       value: item.rainfall_mm,    unit: "mm/yr", good: true },
                                    ] as const).filter(f => f.value !== null).map((f, idx) => (
                                      <div key={idx} className="flex items-center justify-between px-3 py-2.5">
                                        {/* Label */}
                                        <span className="text-sm font-medium text-foreground">{f.label}</span>
                                        {/* Value — always high contrast */}
                                        <span className={`text-sm font-semibold ${
                                          f.good
                                            ? "text-green-700 dark:text-green-400"
                                            : "text-red-600 dark:text-red-400"
                                        }`}>
                                          {f.value}{f.unit}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              )}

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

      </main>
    </div>
  );
}
