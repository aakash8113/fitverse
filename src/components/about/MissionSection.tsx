import { ScrollReveal } from "./ScrollReveal";
import missionImg from "@/assets/about/mission-image.jpg";

const problems = [
  {
    keyword: "Confidence",
    text: "Online shoppers can't try before they buy, leading to uncertainty and dissatisfaction.",
  },
  {
    keyword: "Sustainability",
    text: "The global fashion industry generates around 92 million tonnes of textile waste each year,with fast fashion being a major contributor.",
  },
  {
    keyword: "Innovation",
    text: "Traditional e-commerce lacks the technology to bridge the physical-digital gap.",
  },
];

export function MissionSection() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text */}
          <div>
            <ScrollReveal direction="left">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4 font-medium">
                Our Mission
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-8">
                Making Fashion Personal
                <br />
                & Sustainable
              </h2>
            </ScrollReveal>

            <div className="space-y-8">
              {problems.map((p, i) => (
                <ScrollReveal key={p.keyword} direction="left" delay={0.15 * (i + 1)}>
                  <div className="group">
                    <h3 className="text-lg font-semibold mb-2 inline-block relative">
                      {p.keyword}
                      <span className="absolute -bottom-1 left-0 w-full h-px bg-foreground scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{p.text}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal direction="left" delay={0.6}>
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-sm font-semibold tracking-[0.2em] uppercase text-foreground mb-6">
                  Our Goals
                </p>
                <div className="flex gap-12">
                  <div>
                    <p className="text-3xl sm:text-4xl font-bold text-foreground">73%</p>
                    <p className="text-sm text-muted-foreground mt-1">Less Returns</p>
                  </div>
                  <div>
                    <p className="text-3xl sm:text-4xl font-bold text-foreground">200K+</p>
                    <p className="text-sm text-muted-foreground mt-1">Virtual Try-Ons</p>
                  </div>
                  <div>
                    <p className="text-3xl sm:text-4xl font-bold text-foreground">2500 kg</p>
                    <p className="text-sm text-muted-foreground mt-1">CO₂ Saving</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Image */}
          <ScrollReveal direction="right">
            <div className="relative overflow-hidden sm:overflow-visible">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src={missionImg}
                  alt="Modern fashion boutique interior"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative frame — hidden on mobile to avoid overflow */}
              <div className="hidden sm:block absolute -bottom-4 -right-4 w-full h-full border border-border rounded-2xl -z-10" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
