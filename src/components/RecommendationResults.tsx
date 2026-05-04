import { motion }                                  from "framer-motion";
import { Button }                                  from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }                                   from "@/components/ui/badge";
import { Progress }                                from "@/components/ui/progress";
import type { Recommendation, SoilInput, FertilizerPlanItem } from "@/lib/recommendations";
import { generatePDFReport }                       from "@/lib/pdf-report";
import {
  Download, CloudRain, Sprout, FlaskConical, FileText,
  ArrowLeft, AlertTriangle, CheckCircle, Cpu, RotateCcw,
  Leaf, ShieldAlert,
} from "lucide-react";

interface Props {
  result: Recommendation;
  input:  SoilInput;
  onBack: () => void;
}

export default function RecommendationResults({ result, input, onBack }: Props) {

  const alertIcon = (type: string) => {
    if (type === "danger")  return <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />;
    if (type === "warning") return <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />;
    return <CheckCircle className="h-4 w-4 text-primary shrink-0" />;
  };

  const crops        = result.crops      ?? [];
  const soilAlerts   = result.soilAlerts ?? [];
  const farmerCtx    = result.farmerContext ?? null;

  const mlPrediction = result.mlPrediction ?? null;
  const mlCrop       = mlPrediction?.topCrop  ?? null;
  const mlConf       = mlPrediction?.topConf  ?? null;
  const mlAlgorithm  = mlPrediction?.algorithm ?? "Random Forest";

  // ── Fertilizer plan renderer ─────────────────────────────────────────────
  const renderFertilizerPlan = (plan: import("@/lib/recommendations").FertilizerPlan, cropName: string) => {
    const hasItems    = (plan.items ?? []).length > 0;
    const hasLegacy   = !!(plan.basal || plan.topdress);
    const hasWarnings = (plan.warnings ?? []).length > 0;

    if (!hasItems && !hasLegacy) return null;

    return (
      <div className="rounded-md border border-border p-3 space-y-3">

        {/* Header */}
        <p className="text-xs font-semibold text-foreground flex items-center gap-1">
          <FlaskConical className="h-3.5 w-3.5 text-primary" />
          Fertilizer Plan for {cropName}
          {plan.confidence && (
            <span className={`ml-auto text-[10px] font-normal px-2 py-0.5 rounded-full ${
              plan.confidence.score >= 85
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : plan.confidence.score >= 70
                ? "bg-primary/10 text-primary"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
            }`}>
              {plan.confidence.label}
            </span>
          )}
        </p>

        {/* Rich plan items (new backend shape) */}
        {hasItems && (
          <div className="space-y-2">
            {plan.items!.map((item: FertilizerPlanItem, j: number) => (
              <div
                key={j}
                className="text-xs border-t border-border pt-2 first:border-0 first:pt-0 space-y-1"
              >
                {/* Timing badge + rate */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-[10px]">
                    {item.timing}
                  </span>
                  <span className="text-primary font-semibold text-[11px] tabular-nums">
                    {item.applicationRate}
                  </span>
                </div>

                {/* Action / product name */}
                <p className="font-medium text-foreground">{item.type}</p>

                {/* Notes */}
                {item.notes && (
                  <p className="text-muted-foreground leading-relaxed">{item.notes}</p>
                )}

                {/* Alternative */}
                {item.alternative && (
                  <p className="text-muted-foreground italic">
                    Alternative: {item.alternative}
                  </p>
                )}

                {/* Confidence badge */}
                {item.confidence && (
                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {item.confidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legacy flat fields fallback */}
        {!hasItems && hasLegacy && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {plan.basal && (
              <div>
                <span className="text-muted-foreground">Basal:</span>{" "}
                <strong className="text-foreground">{plan.basal}</strong>
                {plan.basal_rate && (
                  <span className="text-muted-foreground"> @ {plan.basal_rate}</span>
                )}
              </div>
            )}
            {plan.topdress && (
              <div>
                <span className="text-muted-foreground">Top-dress:</span>{" "}
                <strong className="text-foreground">{plan.topdress}</strong>
                {plan.topdress_rate && (
                  <span className="text-muted-foreground"> @ {plan.topdress_rate}</span>
                )}
              </div>
            )}
            {plan.topdress_timing && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Timing:</span>{" "}
                <span className="text-foreground">{plan.topdress_timing}</span>
              </div>
            )}
            {plan.notes && (
              <p className="col-span-2 text-muted-foreground">{plan.notes}</p>
            )}
          </div>
        )}

        {/* Organic advice */}
        {plan.organicAdvice && (
          <div className="flex gap-2 items-start border-t border-border pt-2">
            <Leaf className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <p className="text-xs text-green-800 dark:text-green-300">
              {plan.organicAdvice}
            </p>
          </div>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <div className="border-t border-border pt-2 space-y-1">
            {plan.warnings!.map((w, k) => (
              <div key={k} className="flex gap-1.5 items-start">
                <ShieldAlert className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-300">{w}</p>
              </div>
            ))}
          </div>
        )}

        {/* Confidence message */}
        {plan.confidence?.message && (
          <p className="text-[10px] text-muted-foreground/70 border-t border-border pt-2 leading-relaxed">
            {plan.confidence.message}
          </p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >

      {/* ── Header actions ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> New Analysis
        </Button>
        <Button
          onClick={() => generatePDFReport(input, result)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Download className="mr-2 h-4 w-4" /> Download PDF Report
        </Button>
      </div>

      {/* ── ML Prediction badge ────────────────────────────────────── */}
      {mlCrop && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Cpu className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                ML Model Prediction:{" "}
                <span className="text-primary">{mlCrop}</span>
                {mlConf !== null && (
                  <span className="text-muted-foreground ml-2">({mlConf}% confidence)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Algorithm: {mlAlgorithm}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Farmer context banner ──────────────────────────────────── */}
      {farmerCtx && (
        <div className="flex flex-wrap gap-2 items-center text-xs">
          {farmerCtx.landUseLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              🌾 Goal: {farmerCtx.landUseLabel}
            </span>
          )}
          {farmerCtx.previousCrop && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              <RotateCcw className="h-3 w-3" /> Previous: {farmerCtx.previousCrop}
            </span>
          )}
        </div>
      )}

      {/* ── Rainfall & Soil Assessment ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <CloudRain className="h-4 w-4" /> Rainfall Forecast — {input.district.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {result.forecastedRainfall} mm
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge
                variant={
                  result.rainfallCategory === "High"     ? "default"
                  : result.rainfallCategory === "Low"    ? "destructive"
                  : "secondary"
                }
              >
                {result.rainfallCategory} Rainfall
              </Badge>
              <Badge variant="outline">{result.rainfallBand}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {result.rainfallBandDescription}
            </p>
            {result.rainfallSource && (
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Source: {result.rainfallSource}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Soil Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {result.soilAssessment}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Soil Alerts ────────────────────────────────────────────── */}
      {soilAlerts.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" /> Soil Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {soilAlerts.map((alert, i) => (
              <div
                key={i}
                className={`flex gap-2 items-start p-2 rounded-md text-sm ${
                  alert.type === "danger"
                    ? "bg-destructive/5 text-destructive"
                    : alert.type === "warning"
                    ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                    : alert.type === "ok"
                    ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    : "bg-primary/5 text-primary"
                }`}
              >
                {alertIcon(alert.type)}
                <span>{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── General rotation tip ───────────────────────────────────── */}
      {farmerCtx?.rotationTip && (
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="p-4 flex gap-3 items-start">
            <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Crop Rotation Tip
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                {farmerCtx.rotationTip}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Crop Recommendations ───────────────────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" /> Top Crop Recommendations
        </h2>

        <div className="space-y-4">
          {crops.map((crop, i) => {
            const hasFert = !!(
              (crop.fertilizerPlan?.items ?? []).length > 0 ||
              crop.fertilizerPlan?.basal ||
              crop.fertilizerPlan?.topdress
            );

            return (
              <motion.div
                key={`${crop.crop}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`bg-card border-border hover:shadow-md transition-shadow ${
                  i === 0 ? "border-primary/30" : ""
                }`}>
                  <CardContent className="p-4 space-y-4">

                    {/* Crop header */}
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{crop.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-base">{crop.crop}</h3>
                            {i === 0 && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                                Top Pick
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0 text-xs">{crop.season}</Badge>
                        </div>
                        <Progress value={crop.score ?? 0} className="h-2 mb-1.5" />
                        <p className="text-xs text-muted-foreground">{crop.reason}</p>
                      </div>
                      <span className="text-lg font-bold text-primary tabular-nums shrink-0">
                        {crop.score}%
                      </span>
                    </div>

                    {/* Fertilizer Plan */}
                    {hasFert && renderFertilizerPlan(crop.fertilizerPlan, crop.crop)}

                    {/* Rotation Advice */}
                    {crop.rotationAdvice && (
                      <div className={`rounded-md p-3 space-y-1 text-xs border ${
                        crop.rotationAdvice.type === "warning"
                          ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                          : crop.rotationAdvice.type === "positive"
                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                      }`}>
                        <p className={`font-semibold flex items-center gap-1 ${
                          crop.rotationAdvice.type === "warning"
                            ? "text-yellow-800 dark:text-yellow-300"
                            : crop.rotationAdvice.type === "positive"
                            ? "text-green-800 dark:text-green-300"
                            : "text-blue-800 dark:text-blue-300"
                        }`}>
                          <RotateCcw className="h-3 w-3" />
                          {crop.rotationAdvice.type === "warning"
                            ? "⚠ Rotation Warning"
                            : crop.rotationAdvice.type === "positive"
                            ? "✓ Good Rotation"
                            : "ℹ Rotation Info"}
                        </p>
                        <p className={
                          crop.rotationAdvice.type === "warning"
                            ? "text-yellow-700 dark:text-yellow-400"
                            : crop.rotationAdvice.type === "positive"
                            ? "text-green-700 dark:text-green-400"
                            : "text-blue-700 dark:text-blue-400"
                        }>
                          {crop.rotationAdvice.message}
                        </p>
                        <p className="text-muted-foreground italic">
                          {crop.rotationAdvice.recommendation}
                        </p>
                      </div>
                    )}

                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Bottom download ────────────────────────────────────────── */}
      <div className="text-center pt-4 pb-8">
        <Button
          onClick={() => generatePDFReport(input, result)}
          variant="outline"
          size="lg"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Download className="mr-2 h-4 w-4" /> Download Full Report (PDF)
        </Button>
      </div>

    </motion.div>
  );
}