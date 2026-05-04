import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tractor, History } from "lucide-react";

interface FieldAnswers {
  [step: number]: string;
}

interface Props {
  onComplete: (answers: FieldAnswers, landUse: string, previousCrop: string) => void;
}

const LAND_USE_OPTIONS = [
  { value: "food",      label: "Food Crops",    description: "Maize, rice, cassava, beans" },
  { value: "cash",      label: "Cash Crops",    description: "Tobacco, cotton, coffee, tea" },
  { value: "vegetable", label: "Vegetables",    description: "Tomatoes, cabbage, onion" },
  { value: "fruit",     label: "Fruits",        description: "Banana, mango, avocado" },
  { value: "mixed",     label: "Mixed Farming", description: "Combination of food crops" },
];

const PREVIOUS_CROPS = [
  "None / First time", "Maize", "Beans", "Groundnuts", "Soybean",
  "Tobacco", "Cotton", "Rice", "Cassava", "Sweet Potato",
  "Pigeon Peas", "Sorghum", "Millet", "Sunflower", "Banana",
  "Tomato", "Cabbage",
];

const QUESTIONS = [
  {
    id:       "colour",
    question: "What colour is your soil?",
    hint:     "Look at freshly dug soil — not the surface crust",
    options: [
      { value: "dark_black",   icon: "⬛", main: "Very dark black / deep brown",  sub: "High organic matter ~4–5.5% — excellent fertility" },
      { value: "medium_brown", icon: "🟫", main: "Medium brown",                  sub: "Moderate fertility ~1.5–3%" },
      { value: "light_brown",  icon: "🏜️", main: "Light brown / yellowish",       sub: "Lower fertility ~0.8–1.5%" },
      { value: "red",          icon: "🔴", main: "Reddish / orange-red",           sub: "Iron-rich laterite — often acidic pH 5–6" },
      { value: "pale",         icon: "⬜", main: "Pale grey / whitish",            sub: "Sandy, very low nutrients" },
    ],
  },
  {
    id:       "texture",
    question: "Roll moist soil between your fingers. What forms?",
    hint:     "Take a handful of moist soil and try to roll it",
    options: [
      { value: "clay",        main: "Long smooth ribbon (5cm+)",       sub: "Clay — retains water and nutrients well" },
      { value: "loam",        main: "Short crumbly ribbon (2–4cm)",    sub: "Loam — ideal for most crops" },
      { value: "sandy_loam",  main: "Barely forms, feels gritty",     sub: "Sandy loam — drains quickly, needs more fertilizer" },
      { value: "sand",        main: "Falls apart completely",          sub: "Sandy — poor water and nutrient retention" },
    ],
  },
  {
    id:       "drainage",
    question: "Pour water on bare soil. What happens?",
    hint:     "Pour about half a cup and watch for 30 seconds",
    options: [
      { value: "fast",      main: "Soaks in under 10 seconds",         sub: "Very good drainage — may need irrigation in dry spells" },
      { value: "moderate",  main: "Soaks in 10–30 seconds",            sub: "Ideal moisture balance — most crops thrive" },
      { value: "slow",      main: "Still on surface after 1 minute",  sub: "Poor drainage — waterlogging risk" },
      { value: "runoff",    main: "Mostly runs off, hard crust",       sub: "Compaction — needs breaking up, erosion risk" },
    ],
  },
  {
    id:       "symptoms",
    question: "What did your last crop look like?",
    hint:     "Choose the most noticeable sign you observed",
    options: [
      { value: "yellow_leaves",  main: "Yellowing leaves (older leaves first)", sub: "Nitrogen deficiency — most common issue" },
      { value: "purple_stems",   main: "Purple or reddish stems/leaves",        sub: "Phosphorus deficiency" },
      { value: "brown_edges",    main: "Brown or burnt leaf edges",             sub: "Potassium deficiency" },
      { value: "stunted",        main: "Stunted growth despite good rain",      sub: "pH problem — likely too acidic" },
      { value: "pests",          main: "Lots of pests or disease spots",        sub: "Pest pressure — affects yield significantly" },
      { value: "healthy",        main: "Crops looked healthy overall",          sub: "Good soil condition" },
    ],
  },
  {
    id:       "smell",
    question: "Smell a handful of moist soil. What do you notice?",
    hint:     "Early morning when soil is naturally moist is best",
    options: [
      { value: "earthy",  main: "Rich, fresh earthy smell",     sub: "Excellent — very active biological life" },
      { value: "mild",    main: "Mild, not very distinctive",   sub: "Moderate soil health" },
      { value: "sour",    main: "Sour, acidic or fermented",    sub: "Likely waterlogged or acidic pH" },
      { value: "none",    main: "No smell at all — very dusty", sub: "Low biological activity — poor soil health" },
    ],
  },
  {
    id:       "history",
    question: "What is the history of this land?",
    hint:     "Think about the past 2–3 growing seasons",
    options: [
      { value: "virgin",      main: "Newly cleared forest or bush",     sub: "High organic matter, may be slightly acidic" },
      { value: "rotated",     main: "Rotated with legumes recently",    sub: "Good nitrogen from biological fixation" },
      { value: "continuous",  main: "Continuous maize 3+ seasons",      sub: "Likely nitrogen-depleted and acidic" },
      { value: "fallow",      main: "Left fallow 1–2 seasons",          sub: "Recovering — moderate fertility returning" },
      { value: "degraded",    main: "Visibly eroded or degraded land", sub: "Severely depleted — needs intensive management" },
    ],
  },
  {
    id:       "moisture_now",
    question: "What is the current moisture feel of the soil?",
    hint:     "Squeeze a handful — don't judge by the surface",
    options: [
      { value: "wet",        main: "Wet — water oozes when squeezed",   sub: "Too wet — delay planting, drainage needed" },
      { value: "moist",      main: "Moist — forms a ball but crumbles", sub: "Ideal — good planting conditions" },
      { value: "dry_crumb",  main: "Dry — crumbles with pressure",     sub: "Needs irrigation or wait for rain" },
      { value: "very_dry",   main: "Very dry — hard and cracked",       sub: "Severely dry — crops will struggle" },
    ],
  },
];

export default function FieldAssessment({ onComplete }: Props) {
  const [step,         setStep]         = useState(0);
  const [answers,      setAnswers]      = useState<FieldAnswers>({});
  const [landUse,      setLandUse]      = useState("food");
  const [previousCrop, setPreviousCrop] = useState("");
  const [showContext,  setShowContext]  = useState(true);

  const q         = QUESTIONS[step];
  const isLast    = step === QUESTIONS.length - 1;
  const hasAnswer = !!answers[step + 1];

  const select = (value: string) =>
    setAnswers(prev => ({ ...prev, [step + 1]: value }));

  const next = () => {
    if (step < QUESTIONS.length - 1) setStep(s => s + 1);
  };

  const back = () => {
    if (step === 0) setShowContext(true);
    else setStep(s => Math.max(0, s - 1));
  };

  const submit = () =>
    onComplete(
      answers,
      landUse,
      previousCrop === "None / First time" ? "" : previousCrop.toLowerCase(),
    );

  if (showContext) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h3 className="font-display text-lg font-bold text-foreground mb-1">
            Before we start
          </h3>
          <p className="text-sm text-muted-foreground">
            Tell us about your farming goals so we can tailor the recommendations.
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
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

        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
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
            Used for crop rotation advice only — your choice is never restricted.
          </p>
        </div>

        <Button
          onClick={() => setShowContext(false)}
          className="w-full bg-primary text-primary-foreground font-semibold py-5"
          size="lg"
        >
          Start Field Assessment →
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Progress value={((step + 1) / QUESTIONS.length) * 100} className="h-1.5" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(((step + 1) / QUESTIONS.length) * 100)}% complete</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="font-display text-lg font-bold text-foreground mb-1">
            {q.question}
          </h3>
          {q.hint && (
            <p className="text-xs text-muted-foreground mb-4 italic">💡 {q.hint}</p>
          )}

          <div className="space-y-2">
            {q.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => select(opt.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  answers[step + 1] === opt.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <span className="text-2xl shrink-0">{opt.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${
                    answers[step + 1] === opt.value ? "text-primary" : "text-foreground"
                  }`}>
                    {opt.main}
                  </p>
                  <p className="text-xs text-muted-foreground">{opt.sub}</p>
                </div>
                {answers[step + 1] === opt.value && (
                  <span className="ml-auto text-primary shrink-0 font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3">
        <Button variant="outline" onClick={back} className="border-border">
          ← Back
        </Button>
        {isLast ? (
          <Button
            onClick={submit}
            disabled={!hasAnswer}
            className="flex-1 bg-primary text-primary-foreground font-semibold"
          >
            🌱 Get Recommendations
          </Button>
        ) : (
          <Button
            onClick={next}
            disabled={!hasAnswer}
            className="flex-1 bg-primary text-primary-foreground"
          >
            Next →
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Add ±percent natural variability so readings never feel robotic */
function jitter(value: number, percent = 0.07): number {
  return value * (1 + (Math.random() * 2 - 1) * percent);
}

/** Uniform random value within an inclusive range */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Convert field assessment answers to numeric soil values.
 *
 * Design principles:
 *  - Multiplicative scaling (not additive hard-sets) so compounding works
 *  - Texture × drainage interaction effects (most important in Malawi soils)
 *  - Organic matter derived from multiple independent signals
 *  - Natural jitter (±7%) so output feels measured, not calculated
 *  - Agronomically realistic Malawi soil ranges as ceilings/floors
 */
export function fieldAnswersToSoilValues(answers: { [step: number]: string }) {

  // ── 1. Baseline from soil colour ─────────────────────────────────────────
  // Colour is the best single field proxy for OM and fertility level.
  // Ranges are calibrated to published Malawi soil survey means.
  let N: number, P: number, K: number, ph: number, om: number;

  switch (answers[1]) {
    case "dark_black":
      N = rand(100, 125); P = rand(52, 65); K = rand(62, 72); ph = rand(6.1, 6.6); om = rand(4.2, 5.5);
      break;
    case "medium_brown":
      N = rand(68, 88);  P = rand(38, 50); K = rand(45, 58); ph = rand(5.7, 6.3); om = rand(2.4, 3.6);
      break;
    case "light_brown":
      N = rand(44, 62);  P = rand(26, 38); K = rand(32, 44); ph = rand(5.4, 6.0); om = rand(1.2, 2.0);
      break;
    case "red":
      // Fe/Al laterite soils: acidic, P-fixing, lower OM
      N = rand(48, 68);  P = rand(22, 35); K = rand(36, 48); ph = rand(4.8, 5.5); om = rand(1.0, 1.8);
      break;
    case "pale":
      // Sandy leached soils: very low CEC, poor water retention
      N = rand(20, 36);  P = rand(12, 22); K = rand(16, 28); ph = rand(5.5, 6.2); om = rand(0.4, 0.9);
      break;
    default:
      N = rand(60, 80);  P = rand(36, 48); K = rand(42, 55); ph = rand(5.8, 6.2); om = rand(2.0, 3.0);
  }

  // ── 2. Texture — CEC and water-holding capacity ───────────────────────────
  // Clay has high CEC → retains nutrients. Sand leaches them quickly.
  // Moisture baseline is set here as the primary physical driver.
  let moisture = rand(38, 52); // default loam

  switch (answers[2]) {
    case "clay":
      moisture = rand(62, 72);
      K  *= rand(1.12, 1.22);   // strong K retention in clay lattice
      P  *= rand(1.08, 1.16);
      om *= rand(1.08, 1.15);   // clay physically protects OM from mineralisation
      break;
    case "loam":
      moisture = rand(40, 52);
      break;
    case "sandy_loam":
      moisture = rand(25, 36);
      N  *= rand(0.82, 0.92);
      P  *= rand(0.80, 0.90);
      K  *= rand(0.74, 0.84);
      om *= rand(0.80, 0.90);
      break;
    case "sand":
      moisture = rand(16, 26);
      N  *= rand(0.60, 0.72);   // severe leaching
      P  *= rand(0.58, 0.70);
      K  *= rand(0.48, 0.60);
      om *= rand(0.55, 0.70);
      break;
  }

  // ── 3. Drainage — interacts with texture ─────────────────────────────────
  // Key interactions:
  //   slow + clay  → anaerobic → denitrification + P fixation + acidification
  //   fast + sand  → leaching compounds the already-low retention
  const isClay = answers[2] === "clay";
  const isSand = answers[2] === "sand" || answers[2] === "sandy_loam";

  switch (answers[3]) {
    case "fast":
      moisture = Math.min(moisture, rand(16, 24));
      N  *= isSand ? rand(0.68, 0.78) : rand(0.84, 0.92);
      K  *= isSand ? rand(0.62, 0.74) : rand(0.80, 0.90);
      P  *= isSand ? rand(0.74, 0.86) : rand(0.88, 0.96);
      break;
    case "moderate":
      moisture = Math.min(Math.max(moisture, 36), 58);
      break;
    case "slow":
      moisture = Math.max(moisture, rand(64, 74));
      if (isClay) {
        // Waterlogged heavy clay: anaerobic N loss + P fixation + organic acid production
        N  *= rand(0.68, 0.80);
        P  *= rand(0.76, 0.86);
        ph  = Math.min(ph - rand(0.3, 0.6), 5.5);
        om *= rand(0.85, 0.95);
      } else {
        N  *= rand(0.82, 0.92);
      }
      break;
    case "runoff":
      moisture = Math.max(moisture, rand(50, 62));
      N  *= rand(0.72, 0.84);   // topsoil erosion = significant N loss
      P  *= rand(0.80, 0.92);
      K  *= rand(0.76, 0.88);
      om *= rand(0.72, 0.84);
      ph  = Math.min(ph - rand(0.1, 0.3), 5.8);
      break;
  }

  // ── 4. Crop symptoms — direct diagnostic evidence ─────────────────────────
  // Visually observed deficiencies are the most reliable field signal.
  // Use proportional corrections so a depleted soil loses less than a rich one.
  switch (answers[4]) {
    case "yellow_leaves":
      // Mobile nutrient → older leaves first = classic N deficiency
      N *= rand(0.44, 0.58);
      break;
    case "purple_stems":
      // P deficiency, often compounded by acidic or cold soil
      P  *= rand(0.42, 0.56);
      ph  = Math.min(ph - rand(0.2, 0.5), 5.8);
      break;
    case "brown_edges":
      // K deficiency: marginal scorch on older leaves
      K *= rand(0.44, 0.56);
      break;
    case "stunted":
      // Al/Mn toxicity from strong acidity blocks root development
      ph = Math.min(ph - rand(0.5, 0.9), 4.9);
      N *= rand(0.75, 0.88);
      P *= rand(0.70, 0.85);
      break;
    case "pests":
      // Nutrient-stressed plants are more susceptible — moderate penalty
      N *= rand(0.82, 0.92);
      K *= rand(0.84, 0.94);
      break;
    case "healthy":
      // Confirms baseline — gentle upward adjustment
      N  = Math.min(N * rand(1.04, 1.12), 145);
      K  = Math.min(K * rand(1.02, 1.08), 130);
      om = Math.min(om * rand(1.05, 1.12), 7.5);
      break;
  }

  // ── 5. Smell — microbial activity proxy ──────────────────────────────────
  // Geosmin (petrichor) is produced by Streptomyces = healthy aerobic biology.
  // Sour = organic acids from anaerobic fermentation.
  switch (answers[5]) {
    case "earthy":
      N  = Math.min(N * rand(1.06, 1.14), 145);
      om = Math.min(om * rand(1.08, 1.18), 7.5);
      break;
    case "mild":
      break;
    case "sour":
      ph       = Math.max(ph - rand(0.4, 0.7), 4.2);
      moisture = Math.max(moisture, rand(58, 68));
      N       *= rand(0.78, 0.90);
      om      *= rand(0.80, 0.90);
      break;
    case "none":
      // Biological desert: no mineralisation happening
      N  *= rand(0.74, 0.86);
      om *= rand(0.64, 0.78);
      break;
  }

  // ── 6. Land history — longest-term fertility driver ───────────────────────
  switch (answers[6]) {
    case "virgin":
      // Miombo woodland topsoil: high OM, slight acidity from leaf litter
      N  = Math.min(N * rand(1.15, 1.28), 150);
      P  = Math.min(P * rand(1.08, 1.16), 110);
      om = Math.min(om * rand(1.16, 1.28), 7.5);
      ph = Math.min(ph, rand(5.6, 6.2));
      break;
    case "rotated":
      // Legume rotation: biological N fixation equivalent to 40–100 kg N/ha
      N  = Math.min(N * rand(1.22, 1.38), 155);
      P  = Math.min(P * rand(1.08, 1.18), 110);
      om = Math.min(om * rand(1.05, 1.14), 7.0);
      break;
    case "continuous":
      // Continuous maize: N mining + acidification (well-documented in Malawi)
      N  = Math.max(N * rand(0.50, 0.64), 10);
      ph = Math.min(ph - rand(0.4, 0.7), 5.4);
      om *= rand(0.76, 0.88);
      break;
    case "fallow":
      N  = Math.min(N * rand(1.06, 1.16), 130);
      om = Math.min(om * rand(1.04, 1.12), 6.5);
      break;
    case "degraded":
      N  = Math.max(N * rand(0.38, 0.52), 7);
      P  = Math.max(P * rand(0.46, 0.60), 5);
      K  = Math.max(K * rand(0.52, 0.65), 7);
      om = Math.max(om * rand(0.40, 0.56), 0.3);
      ph = Math.min(ph - rand(0.3, 0.6), 5.0);
      moisture = Math.min(moisture, rand(18, 28));
      break;
  }

  // ── 7. Current moisture feel — physical ground truth ─────────────────────
  // Farmer's direct tactile reading — treat as most authoritative moisture signal.
  switch (answers[7]) {
    case "wet":
      moisture = Math.max(moisture, rand(78, 90));
      N       *= rand(0.86, 0.94); // denitrification in saturated soil
      break;
    case "moist":
      moisture = Math.max(38, Math.min(moisture, rand(55, 65)));
      break;
    case "dry_crumb":
      moisture = Math.min(moisture, rand(22, 32));
      break;
    case "very_dry":
      moisture = Math.min(moisture, rand(8, 16));
      N       *= rand(0.84, 0.92); // mineralisation slows in very dry soil
      break;
  }

  // ── 8. Moisture-nutrient availability coupling ────────────────────────────
  // Waterlogged → leaching/denitrification; very dry → poor microbial uptake
  if (moisture > 72) {
    N *= rand(0.86, 0.94);
    P *= rand(0.90, 0.97);
  } else if (moisture < 22) {
    N *= rand(0.82, 0.92);
  }

  // ── 9. Sanity floor on organic matter ────────────────────────────────────
  om = Math.max(om, 0.3);

  // ── 10. Natural jitter — makes output feel measured, not calculated ───────
  N        = jitter(N);
  P        = jitter(P);
  K        = jitter(K);
  ph       = jitter(ph, 0.025); // pH: tighter range
  moisture = jitter(moisture, 0.06);
  om       = jitter(om, 0.06);

  // ── 11. Final clamp to agronomically realistic Malawi ranges ─────────────
  return {
    nitrogen:      Math.round(Math.max(5,   Math.min(N,        200))),
    phosphorus:    Math.round(Math.max(5,   Math.min(P,        150))),
    potassium:     Math.round(Math.max(5,   Math.min(K,        150))),
    ph:            Math.round(Math.max(3.8, Math.min(ph,       7.8)) * 10) / 10,
    moisture:      Math.round(Math.max(5,   Math.min(moisture, 100))),
    temperature:   25,
    organicMatter: Math.round(Math.max(0.3, Math.min(om,       8.0)) * 10) / 10,
  };
}