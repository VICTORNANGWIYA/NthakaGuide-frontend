/**
 * FirstTimeGuide.tsx
 *
 * Full-screen onboarding tour shown ONCE to first-time users after login.
 * Stores completion in localStorage keyed by user ID so it never shows again.
 *
 * Usage: Drop <FirstTimeGuide /> into your App.tsx or layout component.
 * It renders nothing if the user has already completed the tour.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, FlaskConical, Sprout, CloudRain,
  MessageCircle, FileText, ChevronRight, ChevronLeft,
  X, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// ── Tour step definitions ─────────────────────────────────────────────────────
const STEPS = [
  {
    icon: <Sprout className="h-10 w-10" />,
    color: "from-emerald-500/20 to-emerald-600/5",
    accent: "text-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-600",
    title: "Welcome to NthakaGuide!",
    subtitle: "Your AI-powered farming advisor for Malawi",
    body: "NthakaGuide uses machine learning trained on 66,000+ soil records to give you precise crop and fertilizer recommendations — tailored to your district's soil and rainfall. This short tour will show you how everything works.",
    tip: null,
  },
  {
    icon: <MapPin className="h-10 w-10" />,
    color: "from-blue-500/20 to-blue-600/5",
    accent: "text-blue-500",
    badge: "bg-blue-500/15 text-blue-600",
    title: "Step 1 — Choose your district",
    subtitle: "Coverage across all 28 Malawi districts",
    body: "On the Analyse page, start by selecting your district from the dropdown. NthakaGuide uses your district to load 30 years of local rainfall data and filter recommendations to crops that actually grow in your agro-ecological zone.",
    tip: "Districts are grouped by region — Northern, Central, and Southern — so you can find yours quickly.",
  },
  {
    icon: <FlaskConical className="h-10 w-10" />,
    color: "from-violet-500/20 to-violet-600/5",
    accent: "text-violet-500",
    badge: "bg-violet-500/15 text-violet-600",
    title: "Step 2 — Enter your soil data",
    subtitle: "Three ways to input — no lab needed",
    body: "Use the sliders or type exact values for Nitrogen (N), Phosphorus (P), Potassium (K), pH, moisture, temperature, and organic matter. You can also choose your land use (food crops, cash crops, vegetables) and what you grew last season for rotation advice.",
    tip: "Not sure of exact values? Use the slider midpoints as a starting point, then refine after a soil test.",
  },
  {
    icon: <Sprout className="h-10 w-10" />,
    color: "from-green-500/20 to-green-600/5",
    accent: "text-green-500",
    badge: "bg-green-500/15 text-green-600",
    title: "Step 3 — Read your recommendations",
    subtitle: "Top 5 crops ranked by confidence score",
    body: "After pressing 'Analyse Soil', you get a ranked list of the 5 best crops for your conditions — each with a confidence score, soil suitability reason, and a specific fertilizer plan. Fertilizer plans only include products available at ADMARC and local agro-dealers.",
    tip: "Click any crop card to expand its full fertilizer schedule including basal and top-dress timings.",
  },
  {
    icon: <CloudRain className="h-10 w-10" />,
    color: "from-sky-500/20 to-sky-600/5",
    accent: "text-sky-500",
    badge: "bg-sky-500/15 text-sky-600",
    title: "Step 4 — Check the Rainfall tab",
    subtitle: "Live NASA POWER data for your district",
    body: "The Rainfall tab shows a 12-month rainfall forecast for your district using NASA POWER satellite data. Fertilizer plans automatically adjust their nitrogen rates based on expected rainfall — higher rainfall = higher leaching risk.",
    tip: "The risk flags (Drought Risk, Flood Risk) at the top of the chart give you a quick seasonal summary.",
  },
  {
    icon: <MessageCircle className="h-10 w-10" />,
    color: "from-amber-500/20 to-amber-600/5",
    accent: "text-amber-500",
    badge: "bg-amber-500/15 text-amber-600",
    title: "Step 5 — Ask the AI assistant",
    subtitle: "Powered by Meta LLaMA 3.1",
    body: "The gold chat button in the bottom-right corner opens the NthakaGuide AI assistant. Ask it anything — why a crop was recommended, how to apply a specific fertilizer, what to do about pests, or anything else about farming in Malawi.",
    tip: "You can have multiple conversations saved separately — tap the arrow (›) in the chat header to switch between them.",
  },
  {
    icon: <FileText className="h-10 w-10" />,
    color: "from-orange-500/20 to-orange-600/5",
    accent: "text-orange-500",
    badge: "bg-orange-500/15 text-orange-600",
    title: "Step 6 — Save & print your report",
    subtitle: "Take results to agri-shops or extension offices",
    body: "After analysis, use the 'Download PDF Report' button to save a full report with all crop recommendations, fertilizer plans, and rainfall data. Your past analyses are also saved in your account History so you can compare seasons.",
    tip: "The report is formatted for A4 printing — ideal for sharing with Agricultural Extension Development Officers (AEDOs).",
  },
  {
    icon: <CheckCircle2 className="h-10 w-10" />,
    color: "from-emerald-500/20 to-teal-600/5",
    accent: "text-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-600",
    title: "You're ready to go!",
    subtitle: "Start your first soil analysis",
    body: "That's everything you need to know. If you ever need a reminder, visit Help & Support from the footer. The AI assistant is always available for specific questions. Happy farming!",
    tip: "Tip: Save your analysis history to compare recommendations across different seasons.",
  },
];

// ── Storage helpers ───────────────────────────────────────────────────────────
const tourKey = (userId: string) => `nthakaguide_tour_done_${userId}`;

function hasDoneTour(userId: string): boolean {
  try {
    return localStorage.getItem(tourKey(userId)) === "1";
  } catch {
    return false;
  }
}

function markTourDone(userId: string) {
  try {
    localStorage.setItem(tourKey(userId), "1");
  } catch {}
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FirstTimeGuide() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  // FIX: Derive userId inside the effect so we always react to the latest user,
  // including when AuthContext resolves asynchronously after mount.
  useEffect(() => {
    // Wait until auth context has resolved a real user
    if (!user) return;

    const userId = user.id ?? user.email ?? "";
    if (!userId) return;

    // Tour already completed for this user — do nothing
    if (hasDoneTour(userId)) return;

    // Small delay so the page behind renders first
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [user]); // Re-run whenever the user object changes (e.g. login resolves)

  const userId = user?.id ?? user?.email ?? "";

  const dismiss = () => {
    if (userId) markTourDone(userId);
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const prev = () => setStep(s => Math.max(0, s - 1));

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  // FIX: Don't bail out before AnimatePresence — render it always so the exit
  // animation can play. The `visible` flag controls what's actually shown.
  // Only hard-bail if there's truly no user AND the modal isn't open.
  if (!user && !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

              {/* Gradient accent background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${current.color} pointer-events-none`} />

              {/* Close button */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Skip tour"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-border">
                <motion.div
                  className="h-full bg-primary"
                  initial={false}
                  animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Content */}
              <div className="relative px-8 pt-10 pb-8">

                {/* Step badge */}
                <div className="flex items-center gap-3 mb-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${current.badge}`}>
                    {step === 0 ? "Getting started" : step === STEPS.length - 1 ? "All done" : `Step ${step} of ${STEPS.length - 2}`}
                  </span>
                </div>

                {/* Icon + text — animate per step */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className={`mb-5 ${current.accent}`}>
                      {current.icon}
                    </div>

                    <h2 className="font-display text-2xl font-bold text-foreground mb-1 leading-tight">
                      {current.title}
                    </h2>
                    <p className="text-sm font-semibold text-muted-foreground mb-4">
                      {current.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {current.body}
                    </p>

                    {current.tip && (
                      <div className="flex gap-2.5 bg-muted/60 border border-border rounded-xl p-3.5">
                        <span className="text-base shrink-0">💡</span>
                        <p className="text-xs text-muted-foreground leading-relaxed">{current.tip}</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                  {/* Dot indicators */}
                  <div className="flex gap-1.5">
                    {STEPS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setStep(i)}
                        className={`rounded-full transition-all duration-300 ${
                          i === step
                            ? "w-5 h-2 bg-primary"
                            : "w-2 h-2 bg-border hover:bg-muted-foreground"
                        }`}
                        aria-label={`Go to step ${i + 1}`}
                      />
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    {!isFirst && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={prev}
                        className="text-muted-foreground"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={next}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-5"
                    >
                      {isLast ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1.5" /> Start Farming
                        </>
                      ) : (
                        <>
                          {isFirst ? "Begin Tour" : "Next"}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Skip link */}
                {!isLast && (
                  <button
                    onClick={dismiss}
                    className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip tour
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}