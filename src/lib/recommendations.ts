import { type District } from "./malawi-districts";

export interface SoilInput {
  nitrogen:      number;
  phosphorus:    number;
  potassium:     number;
  ph:            number;
  moisture:      number;
  temperature:   number;
  organicMatter: number;
  district:      District;
  landUse?:      string;
  previousCrop?: string;
}

export interface RotationAdvice {
  type:           "warning" | "positive" | "info";
  message:        string;
  recommendation: string;
}

// ── Rich fertilizer plan item (from algorithms.py) ────────────────────────
export interface FertilizerPlanItem {
  type:            string;         // product name or action description
  applicationRate: string;         // e.g. "NPK 23:21:0 — 200 kg/ha"
  timing:          string;         // e.g. "At planting" or "Top-dressing 1 — 4–6 weeks"
  notes?:          string;         // agronomic rationale
  alternative?:    string | null;  // alternative product if available
  confidence?:     string | null;  // e.g. "High"
  products?:       string[];       // raw product strings
}

// ── FertilizerPlan: rich items + legacy flat fields for backward compat ───
export interface FertilizerPlan {
  // New rich structure
  items?:         FertilizerPlanItem[];
  warnings?:      string[];
  organicAdvice?: string;
  confidence?: {
    score:   number;
    label:   string;
    message: string;
    issues?: string[];
  };

  // Legacy flat fields (kept for PDF report and old data)
  basal?:           string;
  basal_rate?:      string;
  topdress?:        string;
  topdress_rate?:   string;
  topdress_timing?: string;
  notes?:           string;
}

export interface SoilAlert {
  type:    "danger" | "warning" | "info" | "ok";
  message: string;
  icon?:   string;
}

export interface CropRecommendation {
  crop:           string;
  score:          number;
  confidence:     number;
  reason:         string;
  season:         string;
  emoji:          string;
  fertilizerPlan: FertilizerPlan;
  rotationAdvice: RotationAdvice | null;
}

export interface FarmerContext {
  landUse:      string;
  landUseLabel: string;
  previousCrop: string | null;
  rotationTip:  string | null;
}

export interface Recommendation {
  crops:                   CropRecommendation[];
  forecastedRainfall:      number;
  rainfallCategory:        string;
  rainfallBand:            string;
  rainfallBandDescription: string;
  rainfallSource:          string;
  soilAssessment:          string;
  soilAlerts:              SoilAlert[];
  farmerContext:            FarmerContext;
  districtInfo:             { district: string; climateZone: string; zoneDescription: string };
  mlPrediction: {
    algorithm: string;
    topCrop:   string | null;
    topConf:   number | null;
  } | null;
}

export async function generateRecommendations(
  input: SoilInput,
  token?: string,
): Promise<Recommendation> {

  const res = await fetch("http://localhost:5000/api/recommend", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      nitrogen:      input.nitrogen,
      phosphorus:    input.phosphorus,
      potassium:     input.potassium,
      ph:            input.ph,
      moisture:      input.moisture,
      temperature:   input.temperature,
      organicMatter: input.organicMatter,
      districtName:  input.district.name,
      landUse:       input.landUse      ?? "food",
      previousCrop:  input.previousCrop ?? "",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Recommendation failed");
  }

  return data as Recommendation;
}