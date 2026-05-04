import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, HelpCircle } from "lucide-react";


import heroImage   from "@/assets/hero-farm.jpg";
import slide2      from "@/assets/hero-slide2.jpg";   
import slide3      from "@/assets/hero-slide3.jpg";   
import slide4      from "@/assets/hero-slide4.jpg";  
import slide5      from "@/assets/hero-slide5.jpg";  


import iconCrop        from "@/assets/icon-crop.avif";      
import iconFertilizer  from "@/assets/icon-fertilizer.jpeg"; 
import iconInputModes  from "@/assets/icon-input.png";      
import iconRainfall    from "@/assets/icon-rainfall.avif";  
import iconReport      from "@/assets/icon-report.avif";   

import logo from "@/assets/logo.jpeg";
import NavHeader from "@/components/NavHeader";
import Chatbot from "@/components/Chatbot";

const HERO_SLIDES = [heroImage, slide2, slide3, slide4, slide5];

const stats = [
  { value: "99.55%", label: "Crop Model F1-Score",  color: "text-primary"   },
  { value: "22",     label: "Crop Classes",          color: "text-accent"    },
  { value: "10",      label: "Fertilizer Types",      color: "text-golden"    },
  { value: "28",     label: "Malawi Districts",       color: "text-secondary" },
];

const features = [
  {
    img:   iconCrop,
    title: "Crop Recommendations",
    desc:  "Get the best crops for your soil conditions across 15+ Malawi-relevant crops.",
    fit:   "object-cover",
  },
  {
    img:   iconFertilizer,
    title: "Fertilizer Plans",
    desc:  "Precise fertilizer type, rate, and timing recommendations tailored to your soil.",
    fit:   "object-cover",
  },
  {
    img:   iconInputModes,
    title: "Three Input Modes",
    desc:  "Lab values, field visual assessment without equipment, or both. No farmer is left out.",
    fit:   "object-contain bg-white",
  },
  {
    img:   iconRainfall,
    title: "Rainfall Intelligence",
    desc:  "30-year district rainfall data with EWMA seasonal forecasting. Plans auto-adjust to rainfall.",
    fit:   "object-contain bg-white",
  },
  {
    img:   iconReport,
    title: "Printable Reports",
    desc:  "Generate and print full crop + fertilizer reports for farmers to take to agri-shops or extension offices.",
    fit:   "object-contain bg-white",
  },
];


function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent(c => (c + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Slides – cross-fade */}
      {HERO_SLIDES.map((src, i) => (
        <AnimatePresence key={i}>
          {i === current && (
            <motion.img
              key={src}
              src={src}
              alt=""
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
          )}
        </AnimatePresence>
      ))}

     
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 bg-golden"
                : "w-2 bg-primary-foreground/40 hover:bg-primary-foreground/70"
            }`}
          />
        ))}
      </div>
    </>
  );
}

export default function Index() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <HeroSlideshow />
        <div className="absolute inset-0 bg-hero-overlay z-10" />

        <div className="relative z-20 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logo} alt="NthakaGuide logo" className="h-12 w-12 rounded-lg shadow-lg" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
              <span className="text-golden font-body text-xs tracking-widest uppercase font-semibold">
                Smart Soil Analysis for Malawi
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Smarter Farming{" "}
              <span className="block text-golden">with Soil Intelligence</span>
            </h1>

            <p className="text-primary-foreground/80 text-lg sm:text-xl font-body max-w-xl mx-auto mb-8 leading-relaxed">
              Machine learning crop recommendations and fertilizer predictions tailored to your
              soil properties and Malawi's rainfall patterns.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/recommend">
                <Button
                  size="lg"
                  className="bg-golden text-golden-foreground hover:bg-golden/90 font-semibold text-lg px-8 py-6 shadow-golden"
                >
                  Start Analysis <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-golden-foreground/30 text-golden-foreground hover:bg-golden-foreground/10 text-lg px-8 py-6"
                >
                  About
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-8 px-4 -mt-12 relative z-20">
        <div className="container max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(s => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-lg p-4 text-center shadow-sm"
            >
              <p className={`text-2xl sm:text-3xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How NthakaGuide Helps
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Empowering Malawian farmers with data-driven agricultural decisions no expensive
              sensors required.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg bg-card border border-border hover:shadow-golden transition-all duration-300 group overflow-hidden"
              >
                <div className="h-36 w-full overflow-hidden bg-muted">
                  <img
                    src={f.img}
                    alt={f.title}
                    className={`w-full h-full ${f.fit} transition-transform duration-500 group-hover:scale-105`}
                  />
                </div>

                <div className="p-5">
                  <h3 className="font-display font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-earth-gradient">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-earth-foreground mb-4">
            Ready to Optimize Your Farm?
          </h2>
          <p className="text-earth-foreground/80 mb-8 text-lg">
            Enter your soil data and get personalized crop and fertilizer recommendations in seconds.
          </p>
          <Link to="/recommend">
            <Button
              size="lg"
              className="bg-golden text-golden-foreground hover:bg-golden/90 font-semibold text-lg px-10 py-6 shadow-golden"
            >
              Get Started <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-border bg-card">
        <div className="container max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="NthakaGuide" className="h-6 w-6 rounded" />
            <span className="font-display font-semibold text-foreground">NthakaGuide</span>
          </div>

          <Link to="/help">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 border-border hover:border-primary hover:text-primary transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </Button>
      </Link>
         </div>
      </footer>

      <Chatbot />
    </div>
  );
}