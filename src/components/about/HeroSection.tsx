import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useParallax } from "@/hooks/use-scroll-animation";
import heroStore from "@/assets/about/hero-store.jpg";
import heroRack from "@/assets/about/hero-rack.jpg";
import heroFashion from "@/assets/about/hero-fashion.jpg";
import carousel1 from "@/assets/about/carousel_1.png";
import carousel2 from "@/assets/about/carousel_2.jpeg";
import { ChevronDown } from "lucide-react";

const SLIDES = [heroStore, heroRack, heroFashion, carousel1, carousel2];
const INTERVAL = 5000;
const TRANSITION_MS = 900;

export function HeroSection() {
  const scrollY = useParallax();
  // Append a clone of the first slide for seamless looping
  const slides = [...SLIDES, SLIDES[0]];
  const lastLoopIndex = slides.length - 1;
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetToFirstSlide = () => {
    setTransitioning(false);
    setIndex(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransitioning(true));
    });
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTransitioning(true);
      setIndex((i) => (i >= lastLoopIndex ? i : i + 1));
    }, INTERVAL);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lastLoopIndex]);

  // Fallback reset in case transitionend is dropped by the browser.
  useEffect(() => {
    if (index !== lastLoopIndex) return;
    const t = setTimeout(() => {
      resetToFirstSlide();
    }, TRANSITION_MS + 120);
    return () => clearTimeout(t);
  }, [index, lastLoopIndex]);

  const handleTrackTransitionEnd = () => {
    if (index !== lastLoopIndex) return;
    resetToFirstSlide();
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Sliding Background */}
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      >
        <div
          className="flex h-full"
          onTransitionEnd={handleTrackTransitionEnd}
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${(index / slides.length) * 100}%)`,
            transition: transitioning ? `transform ${TRANSITION_MS}ms cubic-bezier(0.77,0,0.18,1)` : "none",
          }}
        >
          {slides.map((src, i) => (
            <div
              key={i}
              className="h-full flex-shrink-0"
              style={{ width: `${100 / slides.length}%` }}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm uppercase tracking-[0.3em] text-background/70 mb-6 font-medium text-white"
        >
          Fitverse
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-background leading-[1.1] mb-8 text-white"
        >
          Redefining How Fashion
          <br />
          Is Experienced.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg sm:text-xl text-background/80 max-w-2xl mx-auto leading-relaxed font-light text-white"
        >
          Where artificial intelligence meets personal style — empowering confidence,
          embracing sustainability, and transforming the way you discover fashion.
        </motion.p>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setTransitioning(true);
              setIndex(i);
              startTimer();
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              (index % SLIDES.length) === i ? "w-6 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <span className="text-xs uppercase tracking-[0.2em] text-background/60 dark:text-white">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-background/60 dark:text-white" />
        </motion.div>
      </motion.div>
    </section>
  );
}
