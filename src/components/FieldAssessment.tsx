import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tractor, History } from "lucide-react";



export interface FieldAnswers {
  colour?: string;
  texture?: string;
  drainage?: string;
  history?: string;
  symptoms?: string;
}

export interface SoilValues {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  moisture: number;
  temperature: number;
  organicMatter: number;
  electricalConductivity: number;
  confidence: number;
}

interface Props {
  onComplete: (
    answers: FieldAnswers,
    landUse: string,
    previousCrop: string,
    soilValues: SoilValues,
  ) => void;
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



const BASE_QUESTIONS = [
  {
    id: "colour",
    question: "What colour is your soil?",
    hint: "Look at freshly dug soil — not the surface crust",
    options: [
      { value: "dark_black",   icon: "⬛", main: "Very dark black / deep brown", sub: "High organic matter ~4–5.5% — excellent fertility" },
      { value: "medium_brown", icon: "🟫", main: "Medium brown",                 sub: "Moderate fertility ~1.5–3%" },
      { value: "light_brown",  icon: "🏜️", main: "Light brown / yellowish",      sub: "Lower fertility ~0.8–1.5%" },
      { value: "red",          icon: "🔴", main: "Reddish / orange-red",          sub: "Iron-rich laterite — often acidic pH 5–6" },
      { value: "pale",         icon: "⬜", main: "Pale grey / whitish",           sub: "Sandy, very low nutrients" },
    ],
  },
  {
    id: "texture",
    question: "Roll moist soil between your fingers. What forms?",
    hint: "Take a handful of moist soil and try to roll it",
    options: [
      { value: "clay",       main: "Long smooth ribbon (5cm+)",    sub: "Clay — retains water and nutrients well" },
      { value: "loam",       main: "Short crumbly ribbon (2–4cm)", sub: "Loam — ideal for most crops" },
      { value: "sandy_loam", main: "Barely forms, feels gritty",  sub: "Sandy loam — drains quickly, needs more fertilizer" },
      { value: "sand",       main: "Falls apart completely",       sub: "Sandy — poor water and nutrient retention" },
    ],
  },
  {
    id: "drainage",
    question: "Pour water on bare soil. What happens?",
    hint: "Pour about half a cup and watch for 30 seconds",
    options: [
      { value: "fast",     main: "Soaks in under 10 seconds",        sub: "Very good drainage — may need irrigation in dry spells" },
      { value: "moderate", main: "Soaks in 10–30 seconds",           sub: "Ideal moisture balance — most crops thrive" },
      { value: "slow",     main: "Still on surface after 1 minute",  sub: "Poor drainage — waterlogging risk" },
      { value: "runoff",   main: "Mostly runs off, hard crust",      sub: "Compaction — erosion risk" },
    ],
  },
  {
    id: "history",
    question: "What is the history of this land?",
    hint: "Think about the past 2–3 growing seasons",
    options: [
      { value: "virgin",     main: "Newly cleared forest or bush",    sub: "High organic matter, slightly acidic" },
      { value: "rotated",    main: "Rotated with legumes recently",   sub: "Good nitrogen from biological fixation" },
      { value: "continuous", main: "Continuous maize 3+ seasons",     sub: "Likely nitrogen depleted and acidic" },
      { value: "fallow",     main: "Left fallow 1–2 seasons",         sub: "Recovering fertility naturally" },
      { value: "degraded",   main: "Visibly eroded or degraded",      sub: "Severely depleted soil" },
    ],
  },
] as const;



type QuestionOption = { value: string; icon?: string; main: string; sub: string };
type DynamicQuestion = { id: "symptoms"; question: string; hint: string; options: QuestionOption[] };

function buildSymptomsQuestion(history: string | undefined): DynamicQuestion {

  
  if (history === "virgin") {
    return {
      id: "symptoms",
      question: "What does the natural vegetation look like?",
      hint: "Observe the wild plants growing on or around this land",
      options: [
        { value: "healthy",       icon: "🌿", main: "Tall, dense green vegetation",        sub: "Indicates good fertility and moisture" },
        { value: "yellow_leaves", icon: "🍂", main: "Yellowing or sparse plant cover",     sub: "May indicate nutrient leaching" },
        { value: "stunted",       icon: "🌱", main: "Short, stunted or patchy growth",     sub: "Possible acidity or shallow topsoil" },
        { value: "pests",         icon: "🐛", main: "Signs of termites or root damage",   sub: "Pest pressure may persist into cultivation" },
        { value: "brown_edges",   icon: "🍁", main: "Dry, brittle or burnt-edge leaves",  sub: "Likely potassium-poor or drought-stressed" },
      ],
    };
  }

  
  if (history === "fallow") {
    return {
      id: "symptoms",
      question: "What grew on this land during the fallow period?",
      hint: "Look at what plants came up naturally while the land was resting",
      options: [
        { value: "healthy",       icon: "🌿", main: "Good regrowth — tall grass or shrubs",  sub: "Soil recovering well, moderate fertility" },
        { value: "yellow_leaves", icon: "🍂", main: "Thin or yellowing regrowth",            sub: "Slow recovery — likely nitrogen-poor" },
        { value: "pests",         icon: "🐛", main: "Lots of weeds or invasive plants",      sub: "Weed pressure will need management" },
        { value: "stunted",       icon: "🌱", main: "Very little grew — bare patches",       sub: "Possible soil compaction or acidity" },
        { value: "brown_edges",   icon: "🏜️", main: "Dry, cracked, hard surface",           sub: "Poor water infiltration — needs tillage" },
      ],
    };
  }

  
  if (history === "degraded") {
    return {
      id: "symptoms",
      question: "What signs of damage can you see on this land?",
      hint: "Look at the surface and any remaining plants",
      options: [
        { value: "stunted",       icon: "🌱", main: "Only stunted, weak plants survive",    sub: "Severe acidity or compaction — needs liming" },
        { value: "yellow_leaves", icon: "🍂", main: "Plants turn yellow very quickly",      sub: "Extreme nitrogen depletion" },
        { value: "runoff",        icon: "🌊", main: "Visible gullies or erosion channels",  sub: "Topsoil largely lost — high restoration input needed" },
        { value: "pests",         icon: "🐛", main: "Heavy termite mounds or root damage", sub: "Biological degradation alongside nutrient loss" },
        { value: "brown_edges",   icon: "🏜️", main: "Hard, sealed surface — nothing grows", sub: "Physical compaction — deep tillage required" },
      ],
    };
  }

  // Rotated land — had legumes, so legume performance is the meaningful question
  if (history === "rotated") {
    return {
      id: "symptoms",
      question: "How did the legume rotation crop perform last season?",
      hint: "Think about the beans, groundnuts, or soybean you grew",
      options: [
        { value: "healthy",        main: "Legume crop was strong and high-yielding", sub: "Excellent nitrogen fixation — soil in good shape" },
        { value: "yellow_leaves",  main: "Legume leaves yellowed early",            sub: "Poor nodulation — limited nitrogen benefit" },
        { value: "stunted",        main: "Plants stayed small despite good rain",   sub: "Likely soil acidity blocking root nodules" },
        { value: "pests",          main: "Heavy pest or disease attack",            sub: "Stress reduced nitrogen fixation benefit" },
        { value: "brown_edges",   main: "Leaves dried and fell early",            sub: "Potassium or moisture stress" },
      ],
    };
  }

 
  return {
    id: "symptoms",
    question: "What did your last crop look like?",
    hint: "Choose the most noticeable sign you observed",
    options: [
      { value: "yellow_leaves", main: "Yellowing leaves (older leaves first)", sub: "Likely nitrogen deficiency — most common" },
      { value: "purple_stems",   main: "Purple or reddish stems / leaves",      sub: "Likely phosphorus deficiency" },
      { value: "brown_edges",    main: "Brown or burnt leaf edges",             sub: "Likely potassium deficiency" },
      { value: "stunted",        main: "Stunted growth despite good rain",      sub: "Likely pH or root problem" },
      { value: "pests",          main: "Heavy pests or disease spots",          sub: "Plant stress and weak vigor" },
      { value: "healthy",        main: "Crop looked healthy overall",           sub: "Good field condition" },
    ],
  };
}



export default function FieldAssessment({ onComplete }: Props) {
  const [step,         setStep]         = useState(0);
  const [answers,      setAnswers]      = useState<FieldAnswers>({});
  const [landUse,      setLandUse]      = useState("food");
  const [previousCrop, setPreviousCrop] = useState("");
  const [showContext,  setShowContext]  = useState(true);

  
  const dynamicQuestions = useMemo(() => {
    return [
      ...BASE_QUESTIONS,
      buildSymptomsQuestion(answers.history),
    ];
  }, [answers.history]);

  const q       = dynamicQuestions[step];
  const isLast  = step === dynamicQuestions.length - 1;
  const hasAnswer = !!answers[q.id as keyof FieldAnswers];

  
  const soilValues = useMemo(() => fieldAnswersToSoilValues(answers), [answers]);

  const select = (value: string) =>
    setAnswers(prev => ({ ...prev, [q.id]: value }));

  const next = () => {
    if (step < dynamicQuestions.length - 1) setStep(prev => prev + 1);
  };

  const back = () => {
    if (step === 0) setShowContext(true);
    else setStep(prev => prev - 1);
  };

  const submit = () =>
    onComplete(
      answers,
      landUse,
      previousCrop === "None / First time" ? "" : previousCrop.toLowerCase(),
      soilValues,
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
            <Tractor className="h-4 w-4 text-primary" />
            What do you want to grow?
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
        
        <Progress value={((step + 1) / dynamicQuestions.length) * 100} className="h-1.5" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {dynamicQuestions.length}</span>
          <span>{Math.round(((step + 1) / dynamicQuestions.length) * 100)}% complete</span>
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
            {q.options.map(opt => {
              const selected = answers[q.id as keyof FieldAnswers] === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => select(opt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                 
                  {"icon" in opt && opt.icon && (
                    <span className="text-2xl shrink-0">{opt.icon}</span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                      {opt.main}
                    </p>
                    <p className="text-xs text-muted-foreground">{opt.sub}</p>
                  </div>

                  {selected && (
                    <span className="ml-auto text-primary shrink-0 font-bold">✓</span>
                  )}
                </button>
              );
            })}
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
            Get Recommendations
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



function jitter(value: number, percent = 0.07): number {
  return value * (1 + (Math.random() * 2 - 1) * percent);
}


function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}



export function fieldAnswersToSoilValues(answers: FieldAnswers): SoilValues {

  
  let N        = 70;
  let P        = 45;
  let K        = 50;
  let ph       = 6.0;
  let om       = 2.5;
  let moisture = 45;
  let ec       = 0.55;
  let confidence = 85;

  

  switch (answers.colour) {
    case "dark_black":
      N = rand(100, 125); P = rand(52, 65); K = rand(62, 72);
      ph = rand(6.1, 6.6); om = rand(4.2, 5.5); ec = rand(0.8, 1.3);
      confidence += 5;
      break;

    case "medium_brown":
      N = rand(68, 88);  P = rand(38, 50); K = rand(45, 58);
      ph = rand(5.7, 6.3); om = rand(2.4, 3.6); ec = rand(0.5, 0.9);
      break;

    case "light_brown":
      N = rand(44, 62);  P = rand(26, 38); K = rand(32, 44);
      ph = rand(5.4, 6.0); om = rand(1.2, 2.0); ec = rand(0.35, 0.7);
      confidence -= 5;
      break;

    case "red":
      
      N = rand(48, 68);  P = rand(22, 35); K = rand(36, 48);
      ph = rand(4.8, 5.5); om = rand(1.0, 1.8); ec = rand(0.4, 0.8);
      break;

    case "pale":
      
      N = rand(20, 36);  P = rand(12, 22); K = rand(16, 28);
      ph = rand(5.5, 6.2); om = rand(0.4, 0.9); ec = rand(0.15, 0.4);
      confidence -= 10;
      break;
  }

  

  switch (answers.texture) {
    case "clay":
      moisture = rand(62, 72);
      K  *= rand(1.12, 1.22);   
      P  *= rand(1.08, 1.16);
      om *= rand(1.08, 1.15);   
      ec *= rand(1.08, 1.18);
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
      ec *= rand(0.72, 0.85);
      confidence -= 4;
      break;

    case "sand":
      moisture = rand(16, 26);
      N  *= rand(0.60, 0.72);   
      P  *= rand(0.58, 0.70);
      K  *= rand(0.48, 0.60);
      om *= rand(0.55, 0.70);
      ec *= rand(0.55, 0.70);
      confidence -= 8;
      break;
  }

  const isClay = answers.texture === "clay";
  const isSand = answers.texture === "sand" || answers.texture === "sandy_loam";

  

  switch (answers.drainage) {
    case "fast":
      moisture = Math.min(moisture, rand(16, 24));
      N  *= isSand ? rand(0.68, 0.78) : rand(0.84, 0.92);
      K  *= isSand ? rand(0.62, 0.74) : rand(0.80, 0.90);
      P  *= isSand ? rand(0.74, 0.86) : rand(0.88, 0.96);
      ec *= rand(0.68, 0.82);
      break;

    case "moderate":
      moisture = Math.min(Math.max(moisture, 36), 58);
      confidence += 4;
      break;

    case "slow":
      moisture = Math.max(moisture, rand(64, 74));
      if (isClay) {
        
        N  *= rand(0.68, 0.80);
        P  *= rand(0.76, 0.86);
        ph  = Math.min(ph - rand(0.3, 0.6), 5.5);
        om *= rand(0.85, 0.95);
        ec *= rand(1.10, 1.28);
      } else {
        N  *= rand(0.82, 0.92);
      }
      break;

    case "runoff":
      moisture = Math.max(moisture, rand(50, 62));
      N  *= rand(0.72, 0.84);  
      P  *= rand(0.80, 0.92);
      K  *= rand(0.76, 0.88);
      om *= rand(0.72, 0.84);
      ph  = Math.min(ph - rand(0.1, 0.3), 5.8);
      ec *= rand(0.78, 0.90);
      confidence -= 6;
      break;
  }

  

  switch (answers.history) {
    case "virgin":
      
      N  = Math.min(N * rand(1.15, 1.28), 150);
      P  = Math.min(P * rand(1.08, 1.16), 110);
      om = Math.min(om * rand(1.16, 1.28), 7.5);
      ph = Math.min(ph, rand(5.6, 6.2));
      confidence += 6;
      break;

    case "rotated":
     
      N  = Math.min(N * rand(1.22, 1.38), 155);
      P  = Math.min(P * rand(1.08, 1.18), 110);
      om = Math.min(om * rand(1.05, 1.14), 7.0);
      confidence += 5;
      break;

    case "continuous":
      
      N  = Math.max(N * rand(0.50, 0.64), 10);
      ph = Math.min(ph - rand(0.4, 0.7), 5.4);
      om *= rand(0.76, 0.88);
      confidence -= 5;
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
      ec *= rand(0.45, 0.65);
      confidence -= 12;
      break;
  }

  

  switch (answers.symptoms) {
    case "yellow_leaves":
      
      N *= rand(0.44, 0.58);
      break;

    case "purple_stems":
     
      P  *= rand(0.42, 0.56);
      ph  = Math.min(ph - rand(0.2, 0.5), 5.8);
      break;

    case "brown_edges":
      
      K *= rand(0.44, 0.56);
      break;

    case "runoff":
      
      N  *= rand(0.50, 0.65);
      P  *= rand(0.55, 0.70);
      K  *= rand(0.55, 0.70);
      om *= rand(0.50, 0.65);
      confidence -= 6;
      break;

    case "stunted":
      
      ph = Math.min(ph - rand(0.5, 0.9), 4.9);
      N *= rand(0.75, 0.88);
      P *= rand(0.70, 0.85);
      confidence -= 4;
      break;

    case "pests":
      
      N *= rand(0.82, 0.92);
      K *= rand(0.84, 0.94);
      break;

    case "healthy":
      // Confirms baseline — gentle upward adjustment
      N  = Math.min(N * rand(1.04, 1.12), 145);
      K  = Math.min(K * rand(1.02, 1.08), 130);
      om = Math.min(om * rand(1.05, 1.12), 7.5);
      confidence += 5;
      break;
  }

  

  om = Math.max(om, 0.3); 

  
  N        = jitter(N);
  P        = jitter(P);
  K        = jitter(K);
  ph       = jitter(ph, 0.025); 
  moisture = jitter(moisture, 0.06);
  om       = jitter(om, 0.06);
  ec       = jitter(ec, 0.08);

  
  return {
    nitrogen:               Math.round(Math.max(5,   Math.min(N,        200))),
    phosphorus:             Math.round(Math.max(5,   Math.min(P,        150))),
    potassium:              Math.round(Math.max(5,   Math.min(K,        150))),
    ph:                     Math.round(Math.max(3.8, Math.min(ph,       7.8)) * 10) / 10,
    moisture:               Math.round(Math.max(5,   Math.min(moisture, 100))),
    temperature:            25,
    organicMatter:          Math.round(Math.max(0.3, Math.min(om,       8.0)) * 10) / 10,
    electricalConductivity: Number(Math.max(0.1,     Math.min(ec,       3.5)).toFixed(2)),
    confidence:             Math.round(Math.max(45,  Math.min(confidence, 98))),
  };
}
