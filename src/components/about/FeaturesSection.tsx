import { ScrollReveal } from "./ScrollReveal";
import { motion } from "framer-motion";
import {
  Camera,
  ShoppingBag,
  Leaf,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const features = [
  { icon: Camera, title: "Virtual Try-On Engine", description: "AI-powered body mapping for realistic garment visualization" },
  { icon: ShoppingBag, title: "Integrated Shop Platform", description: "Curated collections from brands you love, all in one place" },
  { icon: Leaf, title: "Thrift Marketplace", description: "Buy and sell pre-loved fashion sustainably" },
  { icon: ShieldCheck, title: "Secure Image Processing", description: "Enterprise-grade encryption for all your photos and data" },
  { icon: Star, title: "Personalized Recommendations", description: "AI learns your taste to surface pieces you'll actually wear" },
];

function TrendScoreCircle() {
  const [score, setScore] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (entry.isIntersecting) {
          setScore(0);
          let current = 0;
          const target = 87;
          intervalRef.current = setInterval(() => {
            current += 1;
            setScore(current);
            if (current >= target) {
              clearInterval(intervalRef.current!);
              intervalRef.current = null;
            }
          }, 20);
        } else {
          setScore(0);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div ref={ref} className="relative w-36 h-36 mx-auto lg:mx-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-100"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</span>
      </div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="section-container">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4 font-medium">
              Capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Built for Modern Fashion
            </h2>
          </div>
        </ScrollReveal>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={0.08 * (i + 1)}>
              <div className="p-6 rounded-2xl border border-border/50 hover:bg-secondary/50 transition-all duration-500 group">
                <f.icon className="w-6 h-6 mb-4 text-foreground group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* TrendScore Highlight */}
        <ScrollReveal>
          <div
            className="rounded-3xl p-10 sm:p-14 lg:p-16 bg-card dark:bg-card"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold">Special Feature</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  TrendScore™
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-xl mb-6">
                  Our AI-powered outfit rating system evaluates styling harmony, color balance,
                  and trend alignment — giving you a fashion confidence score before you commit to a purchase.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Styling Harmony", "Color Balance", "Trend Alignment"].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-background"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <TrendScoreCircle />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
