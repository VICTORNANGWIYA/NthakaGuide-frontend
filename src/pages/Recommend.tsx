import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavHeader             from "@/components/NavHeader";
import SoilInputForm         from "@/components/SoilInputForm";
import FieldAssessment, { fieldAnswersToSoilValues } from "@/components/FieldAssessment";
import ComboMode             from "@/components/ComboMode";
import RecommendationResults from "@/components/RecommendationResults";
import {
  generateRecommendations,
  type SoilInput,
  type Recommendation,
  type CropRecommendation,
  type FertilizerPlan,

} from "@/lib/recommendations";
import { FlaskConical, Eye } from "lucide-react";
import { getDistrictByName, MALAWI_DISTRICTS } from "@/lib/malawi-districts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label }   from "@/components/ui/label";
import { Mountain, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast }   from "sonner";
import Chatbot from "@/components/Chatbot";

export default function Recommend() {
  const [result,   setResult]   = useState<Recommendation | null>(null);
  const [input,    setInput]    = useState<SoilInput | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [district, setDistrict] = useState("");

  const { user, token } = useAuth();


  const saveToHistory = async (
    soilInput: SoilInput,
    rec:       Recommendation,
    mode:      string,
  ) => {
    if (!user || !token) return;

    const topCrop:   CropRecommendation | undefined = rec.crops?.[0];
    const fertPlan:  FertilizerPlan                 = topCrop?.fertilizerPlan  ?? {};
   

    try {
      const res = await fetch("http://localhost:5000/analysis/", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          district:     soilInput.district.name,
          climate_zone: rec.districtInfo?.climateZone ?? null,
          input_mode:   mode,

          nitrogen:      soilInput.nitrogen,
          phosphorus:    soilInput.phosphorus,
          potassium:     soilInput.potassium,
          ph:            soilInput.ph,
          moisture:      soilInput.moisture,
          temperature:   soilInput.temperature,
          organicMatter: soilInput.organicMatter,

          rainfall_mm:       rec.forecastedRainfall  ?? null,
          rainfall_band:     rec.rainfallBand        ?? null,
          rainfall_category: rec.rainfallCategory    ?? null,

          recommended_crop: topCrop?.crop                 ?? "Unknown",
          crop_score:       topCrop?.score                ?? null,
          crop_confidence:  topCrop?.confidence           ?? null,
          crop_season:      topCrop?.season               ?? null,
          fertilizer_type:  fertPlan?.basal               ?? null,
         

          land_use:      soilInput.landUse      ?? "food",
          previous_crop: soilInput.previousCrop ?? "",

          all_crops:   rec.crops      ?? [],
          soil_alerts: rec.soilAlerts ?? [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Save failed:", err);
      }
    } catch (err) {
      console.error("History save error:", err);
    }
  };

  
  const runAnalysis = async (data: SoilInput, mode: string) => {
    setLoading(true);
    try {
      const rec = await generateRecommendations(data, token ?? undefined);
      setInput(data);
      setResult(rec);
      saveToHistory(data, rec, mode).catch(() =>
        console.warn("History save failed silently")
      );
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message ?? "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
  const handleLabSubmit = (data: SoilInput) => runAnalysis(data, "lab");

  
  const handleFieldComplete = (
    answers:      { [step: number]: string },
    landUse:      string,
    previousCrop: string,
  ) => {
    const d = getDistrictByName(district);
    if (!d) return;
    runAnalysis({
      ...fieldAnswersToSoilValues(answers),
      district: d,
      landUse,
      previousCrop,
    }, "field");
  };

 
  const handleComboSubmit = (vals: {
    nitrogen:      number;
    phosphorus:    number;
    potassium:     number;
    ph:            number;
    moisture:      number;
    temperature:   number;
    organicMatter: number;
    landUse:       string;
    previousCrop:  string;
  }) => {
    const d = getDistrictByName(district);
    if (!d) return;
    runAnalysis({ ...vals, district: d }, "combo");
  };

  const handleBack = () => { setResult(null); setInput(null); };

  const regions = ["Northern", "Central", "Southern"] as const;

  const DistrictPicker = () => (
    <div className="space-y-3">
      <Label className="text-base font-display font-semibold flex items-center gap-2">
        <Mountain className="h-4 w-4 text-primary" /> District
      </Label>
      <Select value={district} onValueChange={setDistrict}>
        <SelectTrigger className="bg-background border-border">
          <SelectValue placeholder="Select your district..." />
        </SelectTrigger>
        <SelectContent>
          {regions.map(region => (
            <div key={region}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {region} Region
              </div>
              {MALAWI_DISTRICTS.filter(d => d.region === region).map(d => (
                <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="container max-w-4xl px-4 py-8">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {result ? "Your Recommendations" : "Soil Analyzer"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {result
              ? `Results for ${input?.district.name} district`
              : "Enter your soil data to get crop and fertilizer recommendations"}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-semibold">Running ML analysis...</p>
            <p className="text-xs text-muted-foreground">
              Random Forest · NASA Rainfall · Climate Zone Filter
            </p>
          </div>

        ) : result && input ? (
          <RecommendationResults result={result} input={input} onBack={handleBack} />

        ) : (
          <Tabs defaultValue="lab" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-xl">
  <TabsTrigger
    value="lab"
    className="flex items-center justify-center gap-2 rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
  >
    <FlaskConical className="h-4 w-4" />
    Lab Data
  </TabsTrigger>

  <TabsTrigger
    value="field"
    className="flex items-center justify-center gap-2 rounded-lg font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
  >
    <Eye className="h-4 w-4" />
    Field Data
  </TabsTrigger>
</TabsList>
          
            <TabsContent value="lab">
              <SoilInputForm onSubmit={handleLabSubmit} isLoading={loading} />
            </TabsContent>

        
            <TabsContent value="field" className="space-y-6">
              <DistrictPicker />
              {district
                ? <FieldAssessment onComplete={handleFieldComplete} />
                : <p className="text-muted-foreground text-center py-8">
                    Select a district first to begin field assessment.
                  </p>
              }
            </TabsContent>

            
            <TabsContent value="combo" className="space-y-6">
              <DistrictPicker />
              {district
                ? <ComboMode onSubmit={handleComboSubmit} />
                : <p className="text-muted-foreground text-center py-8">
                    Select a district first.
                  </p>
              }
            </TabsContent>
          </Tabs>
        )}
      
      </main>
    </div>
  );
}
