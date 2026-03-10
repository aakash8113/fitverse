import { ScrollReveal } from "./ScrollReveal";
import sustainableImg from "@/assets/about/sustainable-fashion.jpg";
import { useEffect, useRef, useState } from "react";

export function ClosingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      setOffset((sectionCenter - viewportCenter) * 0.1);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 sm:py-40 overflow-hidden">
      {/* Background image with parallax */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={sustainableImg}
          alt="Sustainable fashion"
          className="absolute inset-0 w-full h-[130%] object-cover -top-[15%]"
          style={{ transform: `translateY(${offset}px)` }}
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 section-container text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight max-w-3xl mx-auto">
            The Future of Fashion
            <br />
            Is Intelligent.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="text-white/90 text-lg sm:text-xl max-w-2xl mx-auto mt-8 leading-relaxed font-light">
            We're building a world where artificial intelligence empowers every individual
            to express their unique style — sustainably, confidently, and without compromise.
            From India to the world, Fitverse is leading the next generation of fashion technology.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <div className="mt-10 flex justify-center">
            <div className="w-16 h-px bg-white/30" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
