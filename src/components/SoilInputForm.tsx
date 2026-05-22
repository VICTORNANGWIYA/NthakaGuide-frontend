import { useState } from "react";
import { motion } from "framer-motion";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label }  from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MALAWI_DISTRICTS, getDistrictByName } from "@/lib/malawi-districts";
import type { SoilInput } from "@/lib/recommendations";
import {
  Leaf, Thermometer, Droplets, FlaskConical,
  Mountain, Tractor, History,
} from "lucide-react";

interface Props {
  onSubmit:   (data: SoilInput) => void;
  isLoading?: boolean;
}

const LAND_USE_OPTIONS = [
  { value: "food",      label: " Food Crops",    description: "Maize, rice, cassava, beans" },
  { value: "cash",      label: " Cash Crops",    description: "Tobacco, cotton, coffee, tea" },
  { value: "vegetable", label: " Vegetables",    description: "Tomatoes, cabbage, onion" },
  { value: "fruit",     label: " Fruits",        description: "Banana, mango, avocado" },
  { value: "mixed",     label: "Mixed Farming", description: "Combination of food crops" },
];

const PREVIOUS_CROPS = [
  // ── Default ──────────────────────────────────────────────
  "None / First time",

  // ── Cereals ──────────────────────────────────────────────
  "Maize",
  "Rice",
  "Sorghum",
  "Millet",
  "Wheat",

  // ── Legumes ──────────────────────────────────────────────
  "Beans",
  "Black Gram",
  "Chickpea",
  "Cowpea",
  "Groundnuts",
  "Kidney Beans",
  "Lentil",
  "Mung Bean",
  "Peas",
  "Pigeon Peas",
  "Soybean",

  // ── Root & Tuber ─────────────────────────────────────────
  "Cassava",
  "Potato",
  "Sweet Potato",

  // ── Cash Crops ───────────────────────────────────────────
  "Coffee",
  "Cotton",
  "Sugarcane",
  "Tea",
  "Tobacco",

  // ── Oilseeds ─────────────────────────────────────────────
  "Sesame",
  "Sunflower",

  // ── Vegetables ───────────────────────────────────────────
  "Bell Pepper",
  "Cabbage",
  "Chilli",
  "Cucumber",
  "Eggplant",
  "Okra",
  "Onion",
  "Pumpkin",
  "Tomato",

  // ── Fruits ───────────────────────────────────────────────
  "Banana",
  "Coconut",
  "Guava",
  "Mango",
  "Muskmelon",
  "Orange",
  "Papaya",
  "Watermelon",
];

export default function SoilInputForm({ onSubmit, isLoading }: Props) {
  const [district,      setDistrict]      = useState("");
  const [nitrogen,      setNitrogen]      = useState(50);
  const [phosphorus,    setPhosphorus]    = useState(30);
  const [potassium,     setPotassium]     = useState(30);
  const [ph,            setPh]            = useState(6.5);
  const [moisture,      setMoisture]      = useState(50);
  const [temperature,   setTemperature]   = useState(25);
  const [organicMatter, setOrganicMatter] = useState(3);
  const [landUse,       setLandUse]       = useState("food");
  const [previousCrop,  setPreviousCrop]  = useState("");

  const regions = ["Northern", "Central", "Southern"] as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = getDistrictByName(district);
    if (!d) return;
    onSubmit({
      nitrogen, phosphorus, potassium, ph,
      moisture, temperature, organicMatter,
      district: d,
      landUse,
      previousCrop: previousCrop === "None / First time" ? "" : previousCrop.toLowerCase(),
    });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >

      {/* ── District ──────────────────────────────────────────────── */}
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
                  <SelectItem key={d.name} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Land use ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <Label className="text-base font-display font-semibold flex items-center gap-2">
          <Tractor className="h-4 w-4 text-primary" /> What do you want to grow?
        </Label>
        <Select value={landUse} onValueChange={setLandUse}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Select land use..." />
          </SelectTrigger>
          <SelectContent>
            {LAND_USE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground ml-2">{opt.description}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          This filters recommendations to crops matching your farming goal.
        </p>
      </div>

      {/* ── Previous crop ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <Label className="text-base font-display font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          What did you grow last season?
          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Select value={previousCrop} onValueChange={setPreviousCrop}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Select previous crop..." />
          </SelectTrigger>
          <SelectContent>
            {PREVIOUS_CROPS.map(crop => (
              <SelectItem key={crop} value={crop}>{crop}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Used to show crop rotation advice. You are not restricted — this is guidance only.
        </p>
      </div>

      {/* ── Soil Nutrients ────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" /> Soil Nutrients (mg/kg)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <SliderField label="Nitrogen (N)"   value={nitrogen}   onChange={setNitrogen}   min={0} max={200} unit="mg/kg" />
          <SliderField label="Phosphorus (P)" value={phosphorus} onChange={setPhosphorus} min={0} max={150} unit="mg/kg" />
          <SliderField label="Potassium (K)"  value={potassium}  onChange={setPotassium}  min={0} max={150} unit="mg/kg" />
        </div>
      </div>

      {/* ── Soil Properties ───────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-base flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" /> Soil Properties
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SliderField label="Soil pH"        value={ph}           onChange={setPh}           min={3} max={10} step={0.1} unit="" />
          <SliderField label="Organic Matter" value={organicMatter} onChange={setOrganicMatter} min={0} max={10} step={0.1} unit="%" />
        </div>
      </div>

      {/* ── Environmental ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-base flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-primary" /> Environmental Conditions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SliderField label="Moisture"    value={moisture}    onChange={setMoisture}    min={0}  max={100} unit="%" icon={<Droplets    className="h-3.5 w-3.5" />} />
          <SliderField label="Temperature" value={temperature} onChange={setTemperature} min={10} max={45}  unit="°C" icon={<Thermometer className="h-3.5 w-3.5" />} />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!district || isLoading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg py-6 shadow-golden"
        size="lg"
      >
        {isLoading ? "Analyzing..." : "🌱 Get Recommendations"}
      </Button>

    </motion.form>
  );
}

function SliderField({
  label, value, onChange, min, max, step = 1, unit, icon,
}: {
  label:    string;
  value:    number;
  onChange: (v: number) => void;
  min:      number;
  max:      number;
  step?:    number;
  unit:     string;
  icon?:    React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm text-muted-foreground flex items-center gap-1">
          {icon} {label}
        </Label>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {value}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
      />
    </div>
  );
}