import { motion } from "framer-motion";
import NavHeader from "@/components/NavHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sprout, CloudRain, FlaskConical, BarChart3,
  Smartphone, Globe, MapPin, Mail, Users, Bug,
  History, FileDown, Leaf,
} from "lucide-react";
import logo from "@/assets/logo.jpeg";

const FEATURES = [
  {
    icon: Sprout,
    title: "Crop Recommendation",
    description:
      "Get the top 5 crops ranked for your exact soil conditions, powered by a Random Forest model trained on real agronomic data across 22 crop classes.",
  },
  {
    icon: FlaskConical,
    title: "Fertilizer Planning",
    description:
      "Every crop recommendation includes a tailored fertilizer plan — basal type, rate, top-dressing timing, and notes adjusted for your rainfall conditions.",
  },
  {
    icon: CloudRain,
    title: "Rainfall Intelligence",
    description:
      "25 years of NASA POWER satellite rainfall history for every district in Malawi, with annual, monthly, weekly and daily breakdowns plus a live 7-day forecast.",
  },
  
  {
    icon: Leaf,
    title: "Soil Health Alerts",
    description:
      "Instantly identifies soil nutrient deficiencies and pH problems in your inputs, with plain-language advice a farmer or extension worker can act on.",
  },
  {
    icon: History,
    title: "Analysis History",
    description:
      "Every analysis you run is saved to your account. Review past recommendations, soil inputs, yield estimates and all five crop options at any time.",
  },
  {
    icon: FileDown,
    title: "PDF Reports",
    description:
      "Download a full PDF report for any analysis — covering the crop recommendations, fertilizer plan, yield predictions, pest risks and rainfall context.",
  },
  {
    icon: Smartphone,
    title: "Works on Any Device",
    description:
      "Fully responsive — works on mobile phones, tablets and desktop computers. No installation needed, just open it in a browser.",
  },
];

const HOW_TO_USE = [
  {
    step: "1",
    title: "Create an account",
    description:
      "Sign up with your email address. This saves your analysis history so you can refer back to past recommendations.",
  },
  {
    step: "2",
    title: "Go to Soil Analyzer",
    description:
      "Choose one of three input methods — Lab Data if you have soil test results, Field Assessment if you are observing your field visually, or Mixed mode to combine both.",
  },
  {
    step: "3",
    title: "Select your district",
    description:
      "Choose your district in Malawi. The system fetches real NASA satellite rainfall data for your location and applies the correct climate zone for accurate results.",
  },
  {
    step: "4",
    title: "Enter your soil values",
    description:
      "Fill in your nitrogen, phosphorus, potassium, pH, moisture, temperature and organic matter values. For field mode, answer the visual assessment questions instead.",
  },
  {
    step: "5",
    title: "Review your recommendations",
    description:
      "Get the top 5 crops with scores, fertilizer plans, yield predictions and pest risk alerts. Download a PDF report to keep or share with an extension worker.",
  },
  {
    step: "6",
    title: "Explore Rainfall Intelligence",
    description:
      "Visit the Rainfall page to explore 25 years of satellite rainfall history, monthly patterns, weekly summaries and daily data for any district.",
  },
];

const DEVELOPER = {
  name:   "JOEL GANIZANI, VICTOR NANGWIYA, EDWIN MWASAMBO, YOHANE KUMWENDA",
  role:   "Developers",
  course: "BSc Information Systems. 2025/2026",
};

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="container max-w-5xl px-4 py-8 space-y-14">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 pt-6 pb-2"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logo} alt="NthakaGuide logo" className="h-12 w-12 rounded-lg shadow-lg" />
            </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            NthakaGuide
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            An intelligent soil analysis and crop recommendation system built
            for smallholder farmers and agricultural extension workers in Malawi —
            combining machine learning, NASA satellite rainfall data, and
            agronomic expertise into one easy-to-use tool.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Covering all 28 districts of Malawi</span>
          </div>
        </motion.div>

        {/* ── Mission ───────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Agriculture is the backbone of Malawi's economy, yet many smallholder
                farmers lack access to timely, location-specific guidance on what to
                plant and how to manage their soil. NthakaGuide bridges that gap —
                putting data-driven crop recommendations, satellite rainfall
                intelligence, and fertilizer planning directly in the hands of
                farmers and extension workers, accessible from any device, at any time,
                completely free.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* ── Features ──────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="font-display text-xl font-bold text-foreground mb-6">
            What NthakaGuide Can Do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
              >
                <Card className="h-full hover:shadow-sm transition-shadow">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-primary/10 shrink-0">
                        <f.icon className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm">
                        {f.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── How to use ────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-xl font-bold text-foreground mb-6">
            How to Use NthakaGuide
          </h2>
          <div className="space-y-3">
            {HOW_TO_USE.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full
                                    bg-primary text-primary-foreground text-sm font-bold shrink-0 mt-0.5">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Technology ────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          
        </motion.section>

        {/* ── Developer ─────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-xl font-bold text-foreground mb-6">
            Developers
          </h2>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex flex-col sm:flex-row gap-5 items-start">

              {/* Avatar placeholder */}
              <div className="flex items-center justify-center h-16 w-16 rounded-full
                              bg-primary/20 text-primary font-bold text-xl shrink-0">
                {DEVELOPER.name.charAt(0)}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground text-base">
                    {DEVELOPER.name}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">{DEVELOPER.role}</p>
                <p className="text-xs text-muted-foreground">{DEVELOPER.course}</p>
                <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Contact nthakaguide@gmail.com</span>
                </div>
              </div>

            </CardContent>
          </Card>
        </motion.section>

        {/* ── Footer note ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center pb-6 space-y-1"
        >
          <p className="text-xs text-muted-foreground">
            NthakaGuide · 2025/2026
          </p>
          <p className="text-xs text-muted-foreground">
            Rainfall data: NASA POWER · Live forecast: Open-Meteo · ML: scikit-learn
          </p>
        </motion.div>

      </main>
    </div>
  );
}