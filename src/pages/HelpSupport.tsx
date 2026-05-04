/**
 * HelpSupport.tsx
 *
 * Full Help & Support page.
 * Linked from the footer Help button (replace the dropdown with <Link to="/help">).
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import NavHeader from "@/components/NavHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle, Mail, BookOpen, MessageCircle,
  Sprout, FlaskConical, MapPin, CloudRain, FileText,
  ChevronRight, RotateCcw, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Chatbot from "@/components/Chatbot";

// ── FAQs ──────────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "How do I get my soil tested?",
    a: "You can take soil samples to the Chitedze Agricultural Research Station, Bvumbwe Research Station, or any district agricultural office. They test for NPK, pH, and organic matter. Alternatively, use the Field Assessment mode which estimates values from visual and sensory observations.",
  },
  {
    q: "What is the Field Assessment mode?",
    a: "Field Assessment is a guided questionnaire that estimates your soil properties based on visual observations — soil colour, texture, smell, and crop history. It is designed for farmers who do not have access to a laboratory.",
  },
  {
    q: "How accurate are the recommendations?",
    a: "The crop recommendation model achieves a 99.55% F1-score using Gaussian Naive Bayes trained on 66,000+ records. Real-world accuracy depends on the quality of your soil input — lab data gives the most precise results.",
  },
  {
    q: "Which crops does NthakaGuide support?",
    a: "We support 22+ crops including maize, rice, tobacco, groundnuts, soybeans, cassava, sweet potatoes, tea, coffee, cotton, sugarcane, pigeon peas, cowpeas, sorghum, millet, bananas, tomatoes, onions, cabbage, beans, and sunflower.",
  },
  {
    q: "How does the rainfall forecast work?",
    a: "We use NASA POWER satellite data for all 28 Malawi districts and apply Exponentially Weighted Moving Average (EWMA) to forecast seasonal rainfall. Fertilizer nitrogen rates automatically adjust based on expected rainfall intensity to account for leaching risk.",
  },
  {
    q: "Can I download my results?",
    a: "Yes — after receiving recommendations, click 'Download PDF Report'. The report includes crop recommendations, fertilizer plans, rainfall data, and soil analysis, and is formatted for A4 printing to share with extension workers or agri-shops.",
  },
  {
    q: "Why does my district affect the crop list?",
    a: "NthakaGuide filters recommendations through Malawi's five agro-ecological zones. For example, tea is only recommended in high-rainfall zones like Mulanje and Thyolo, while sorghum is highlighted in the drier Shire Valley. This prevents the model from recommending crops that cannot grow in your district.",
  },
  {
    q: "What fertilizers does NthakaGuide recommend?",
    a: "Only fertilizers confirmed available in Malawi through ADMARC and agro-dealers: Urea (46-0-0), DAP (18-46-0), CAN, and NPK 23:21:0. We validated availability against FAO fertilizer import data so you won't be sent to look for something unavailable.",
  },
  {
    q: "Is NthakaGuide free to use?",
    a: "Yes — NthakaGuide is completely free for all farmers. It was developed as a final year Computer Science project at the University of Malawi to help farmers make data-driven decisions without expensive consultants.",
  },
  {
    q: "What does the previous crop field do?",
    a: "Entering your previous crop enables crop rotation advice. NthakaGuide will warn you if planting the same crop family two seasons in a row is risky, and highlight crops that benefit from what you grew last season (e.g. maize after legumes takes advantage of residual nitrogen).",
  },
];

// ── How-to steps ──────────────────────────────────────────────────────────────
const HOW_TO = [
  {
    step: "1",
    icon: <MapPin className="h-5 w-5" />,
    title: "Select your district",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    desc: "Choose from all 28 Malawi districts. NthakaGuide loads 30 years of local rainfall data and filters crop recommendations to your agro-ecological zone.",
  },
  {
    step: "2",
    icon: <FlaskConical className="h-5 w-5" />,
    title: "Enter soil data",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    desc: "Use sliders or type exact values for N, P, K, pH, moisture, temperature, and organic matter. Choose land use (food, cash, vegetables) and your previous crop for rotation advice.",
  },
  {
    step: "3",
    icon: <Sprout className="h-5 w-5" />,
    title: "Review crop recommendations",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    desc: "Receive the top 5 crops ranked by confidence score, each with a fertilizer plan, rotation advice, and soil suitability reason. Expand any card for the full fertilizer schedule.",
  },
  {
    step: "4",
    icon: <CloudRain className="h-5 w-5" />,
    title: "Check the Rainfall tab",
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    desc: "View a 12-month rainfall forecast powered by NASA POWER. Risk flags at the top (Drought Risk, Flood Risk) summarise the season at a glance. Fertilizer N rates adjust automatically.",
  },
  {
    step: "5",
    icon: <MessageCircle className="h-5 w-5" />,
    title: "Ask the AI assistant",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    desc: "Tap the gold chat button (bottom-right) to open the NthakaGuide AI assistant powered by Meta LLaMA 3.1. Ask follow-up questions, get pest advice, or request fertilizer application tips in plain language.",
  },
  {
    step: "6",
    icon: <FileText className="h-5 w-5" />,
    title: "Save and print your report",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    desc: "Download a full A4 PDF report of your analysis to share with Agricultural Extension Development Officers or agri-shops. Past analyses are stored in your account History.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function HelpSupport() {
  const { user } = useAuth();
  const [tourReset, setTourReset] = useState(false);

  const userId = user?.id ?? user?.email ?? "";

  const resetTour = () => {
    if (!userId) return;
    try {
      localStorage.removeItem(`nthakaguide_tour_done_${userId}`);
      setTourReset(true);
      setTimeout(() => setTourReset(false), 3000);
      // Reload to trigger the tour
      window.location.reload();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="container max-w-4xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Page header */}
          <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-7 w-7 text-primary shrink-0" />
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Help & Support
              </h1>
            </div>

            {/* Re-launch onboarding tour */}
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetTour}
                className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
              >
                {tourReset ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Restarting…
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" /> Restart app tour
                  </>
                )}
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mb-10 pl-10">
            Find answers to common questions or reach out for assistance
          </p>

          {/* ── Quick help cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {[
              {
                icon: <BookOpen className="h-7 w-7 text-primary" />,
                title: "User Guide",
                desc: "Step-by-step guide below explains every feature and input option.",
                action: null,
              },
              {
                icon: <MessageCircle className="h-7 w-7 text-golden" />,
                title: "AI Assistant",
                desc: "Open the chat button on any page for instant agricultural advice.",
                action: null,
              },
              {
                icon: <Mail className="h-7 w-7 text-secondary" />,
                title: "Contact Us",
                desc: "Email nthakaguide@gmail.com for technical support or feedback.",
                action: "mailto:nthakaguide@gmail.com",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="border-border h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-5 text-center space-y-2 flex flex-col items-center h-full">
                    <div className="p-3 rounded-xl bg-muted mb-1">{card.icon}</div>
                    <h3 className="font-display font-bold text-foreground">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">{card.desc}</p>
                    {card.action && (
                      <a
                        href={card.action}
                        className="text-xs text-primary hover:underline mt-2"
                      >
                        Send email →
                      </a>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* ── How to use guide ─────────────────────────────────────────── */}
          <h2 className="font-display text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> How to Use NthakaGuide
          </h2>

          <div className="space-y-3 mb-12">
            {HOW_TO.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <Card className="border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-start gap-4">
                    {/* Step circle */}
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0 ${s.color}`}>
                      {s.step}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-foreground flex items-center gap-2 flex-wrap">
                        {s.icon}
                        {s.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                    </div>

                    {/* Arrow to analyse page for steps 1–3 */}
                    {(s.step === "1" || s.step === "2" || s.step === "3") && (
                      <Link
                        to="/recommend"
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                        title="Go to Analyse page"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* ── FAQs ─────────────────────────────────────────────────────── */}
          <h2 className="font-display text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions
          </h2>

          <Card className="border-border mb-12">
            <CardContent className="p-4 sm:p-6">
              <Accordion type="single" collapsible className="space-y-1">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                    <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary text-sm">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* ── CTA back to app ──────────────────────────────────────────── */}
          <div className="rounded-xl bg-primary/5 border border-primary/15 p-6 text-center">
            <h3 className="font-display font-bold text-foreground text-lg mb-2">
              Ready to analyse your soil?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get crop and fertilizer recommendations for your district in under 2 seconds.
            </p>
            <Link to="/recommend">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                Start Analysis <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <Chatbot />
    </div>
  );
}