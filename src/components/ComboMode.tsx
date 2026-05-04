import { useState } from "react";
import { motion } from "framer-motion";
import { Button }  from "@/components/ui/button";
import { Slider }  from "@/components/ui/slider";
import { Label }   from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FlaskConical, Thermometer, Droplets, Leaf,
  Tractor, History,
} from "lucide-react";

interface Props {
  onSubmit: (vals: {
    nitrogen:      number;
    phosphorus:    number;
    potassium:     number;
    ph:            number;
    moisture:      number;
    temperature:   number;
    organicMatter: number;
    landUse:       string;
    previousCrop:  string;
  }) => void;
}

const LAND_USE_OPTIONS = [
  { value: "food",      label: "🌽 Food Crops",    description: "Maize, rice, cassava, beans" },
  { value: "cash",      label: "💰 Cash Crops",    description: "Tobacco, cotton, coffee, tea" },
  { value: "vegetable", label: "🥬 Vegetables",    description: "Tomatoes, cabbage, onion" },
  { value: "fruit",     label: "🍌 Fruits",        description: "Banana, mango, avocado" },
  { value: "mixed",     label: "🔀 Mixed Farming", description: "Combination of food crops" },
];

const PREVIOUS_CROPS = [
  "None / First time", "Maize", "Beans", "Groundnuts", "Soybean",
  "Tobacco", "Cotton", "Rice", "Cassava", "Sweet Potato",
  "Pigeon Peas", "Sorghum", "Millet", "Sunflower", "Banana",
  "Tomato", "Cabbage",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Each preset is a factory function returning randomised-but-realistic values.
// Calling it again gives fresh values — presets feel alive, not scripted.
const VISUAL_PRESETS: Record<string, () => {
  nitrogen: number; phosphorus: number; potassium: number;
  ph: number; moisture: number; organicMatter: number;
}> = {
  excellent: () => ({
    nitrogen:      Math.round(rand(88, 118)),
    phosphorus:    Math.round(rand(48, 68)),
    potassium:     Math.round(rand(58, 78)),
    ph:            Math.round(rand(6.1, 6.8) * 10) / 10,
    moisture:      Math.round(rand(46, 62)),
    organicMatter: Math.round(rand(3.6, 5.2) * 10) / 10,
  }),
  good: () => ({
    nitrogen:      Math.round(rand(68, 90)),
    phosphorus:    Math.round(rand(36, 52)),
    potassium:     Math.round(rand(44, 60)),
    ph:            Math.round(rand(5.8, 6.4) * 10) / 10,
    moisture:      Math.round(rand(38, 52)),
    organicMatter: Math.round(rand(2.4, 3.8) * 10) / 10,
  }),
  moderate: () => ({
    nitrogen:      Math.round(rand(44, 66)),
    phosphorus:    Math.round(rand(24, 40)),
    potassium:     Math.round(rand(30, 48)),
    ph:            Math.round(rand(5.4, 6.1) * 10) / 10,
    moisture:      Math.round(rand(28, 44)),
    organicMatter: Math.round(rand(1.3, 2.4) * 10) / 10,
  }),
  poor: () => ({
    nitrogen:      Math.round(rand(22, 44)),
    phosphorus:    Math.round(rand(12, 26)),
    potassium:     Math.round(rand(16, 32)),
    ph:            Math.round(rand(5.0, 5.7) * 10) / 10,
    moisture:      Math.round(rand(18, 32)),
    organicMatter: Math.round(rand(0.7, 1.4) * 10) / 10,
  }),
  degraded: () => ({
    nitrogen:      Math.round(rand(8, 22)),
    phosphorus:    Math.round(rand(5, 15)),
    potassium:     Math.round(rand(8, 18)),
    ph:            Math.round(rand(4.4, 5.2) * 10) / 10,
    moisture:      Math.round(rand(8, 20)),
    organicMatter: Math.round(rand(0.3, 0.8) * 10) / 10,
  }),
};

export default function ComboMode({ onSubmit }: Props) {
  const [nitrogen,      setNitrogen]      = useState(60);
  const [phosphorus,    setPhosphorus]    = useState(40);
  const [potassium,     setPotassium]     = useState(45);
  const [ph,            setPh]            = useState(6.0);
  const [moisture,      setMoisture]      = useState(40);
  const [temperature,   setTemperature]   = useState(25);
  const [organicMatter, setOrganicMatter] = useState(2.5);
  const [landUse,       setLandUse]       = useState("food");
  const [previousCrop,  setPreviousCrop]  = useState("");
  const [preset,        setPreset]        = useState("");

  const applyPreset = (value: string) => {
    setPreset(value);
    const factory = VISUAL_PRESETS[value];
    if (!factory) return;
    const p = factory(); // call the factory — fresh random values each time
    setNitrogen(p.nitrogen);
    setPhosphorus(p.phosphorus);
    setPotassium(p.potassium);
    setPh(p.ph);
    setMoisture(p.moisture);
    setOrganicMatter(p.organicMatter);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      nitrogen, phosphorus, potassium, ph,
      moisture, temperature, organicMatter,
      landUse,
      previousCrop: previousCrop === "None / First time" ? "" : previousCrop.toLowerCase(),
    });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* ── What do you want to grow ──────────────────────────────────── */}
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
          Filters recommendations to crops matching your farming goal.
        </p>
      </div>

      {/* ── Previous crop ─────────────────────────────────────────────── */}
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
          Used for rotation advice only — your choice is never restricted.
        </p>
      </div>

      {/* ── Visual quality preset ─────────────────────────────────────── */}
      <div className="space-y-3">
        <Label className="text-base font-display font-semibold">
          🌿 How would you describe your soil overall?
        </Label>
        <p className="text-xs text-muted-foreground -mt-1">
          Select a preset to auto-fill estimated values, then fine-tune with the sliders below.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { value: "excellent", label: "Excellent", cls: "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
            { value: "good",      label: "Good",      cls: "bg-lime-100 border-lime-400 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300" },
            { value: "moderate",  label: "Moderate",  cls: "bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
            { value: "poor",      label: "Poor",      cls: "bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
            { value: "degraded",  label: "Degraded",  cls: "bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
          ].map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => applyPreset(p.value)}
              className={`rounded-lg border-2 py-2.5 text-sm font-semibold transition-all ${p.cls} ${
                preset === p.value
                  ? "ring-2 ring-primary ring-offset-1 opacity-100"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset && (
          <p className="text-xs text-muted-foreground">
            ✓ Values estimated from <strong>{preset}</strong> — adjust sliders as needed.
          </p>
        )}
      </div>

      {/* ── Soil Nutrients ────────────────────────────────────────────── */}
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

      {/* ── Soil Properties ───────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-base flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" /> Soil Properties
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SliderField label="Soil pH"         value={ph}            onChange={setPh}            min={3}  max={10} step={0.1} unit="" />
          <SliderField label="Organic Matter"  value={organicMatter} onChange={setOrganicMatter} min={0}  max={10} step={0.1} unit="%" />
        </div>
      </div>

      {/* ── Environmental ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-base flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-primary" /> Environmental Conditions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SliderField
            label="Moisture" value={moisture} onChange={setMoisture}
            min={0} max={100} unit="%"
            icon={<Droplets className="h-3.5 w-3.5" />}
          />
          <SliderField
            label="Temperature" value={temperature} onChange={setTemperature}
            min={10} max={45} unit="°C"
            icon={<Thermometer className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg py-6 shadow-golden"
        size="lg"
      >
        🌱 Get Recommendations
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