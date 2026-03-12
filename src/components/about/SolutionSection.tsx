import { ScrollReveal } from "./ScrollReveal";
import { Eye, Sparkles, Recycle, Users, ShieldCheck } from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import logoWhite from "@/assets/logo_white.png";
import logoImage from "@/assets/logo_black.png";

const approaches = [
  {
    icon: Eye,
    title: "AI Visualization Engine",
    description: "See exactly how garments look on your body using our proprietary computer vision technology.",
  },
  {
    icon: Sparkles,
    title: "Smart Product Discovery",
    description: "AI-curated recommendations that learn your style preferences and body type.",
  },
  {
    icon: Recycle,
    title: "Sustainable Marketplace",
    description: "A circular fashion ecosystem where pre-loved pieces find new homes.",
  },
  {
    icon: Users,
    title: "User-Centered Design",
    description: "Every feature is built from real customer feedback and shopping behavior data.",
  },
];

export function SolutionSection() {
  const lastX = useRef<number | null>(null);
  const accRotation = useRef(0);
  const { theme } = useTheme();
  const logo = theme === "dark" ? logoWhite : logoImage;

  const rotateY = useMotionValue(0);
  const smoothRotateY = useSpring(rotateY, { stiffness: 200, damping: 30, mass: 0.3 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (lastX.current !== null) {
      const dx = e.clientX - lastX.current;
      accRotation.current += dx;
      rotateY.set(accRotation.current);
    }
    lastX.current = e.clientX;
  };

  const handleMouseLeave = () => {
    lastX.current = null;
    accRotation.current = 0;
    rotateY.set(0);
  };

  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="section-container">
        <ScrollReveal>
          <div className="text-center mb-20">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4 font-medium">
              The Solution
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl mx-auto">
              The Fitverse Approach
            </h2>
            <p className="text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
              We've built an integrated ecosystem that combines AI-powered virtual try-on,
              curated shopping, and a sustainable thrift marketplace — all in one platform.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <ScrollReveal direction="left">
            <div
              className="aspect-square rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ perspective: "800px" }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <motion.img
                src={logo}
                alt="Fitverse Logo"
                className="w-3/4 h-3/4 object-contain cursor-pointer drop-shadow-md"
                style={{ rotateY: smoothRotateY }}
              />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {approaches.map((item, i) => (
              <ScrollReveal key={item.title} delay={0.1 * (i + 1)}>
                <div className="group p-6 rounded-2xl bg-card dark:bg-card border border-border/50 hover:border-foreground/20 transition-all duration-500 hover:shadow-lg min-h-[230px]">
                  <div className="w-10 h-10 rounded-xl bg-foreground dark:bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-5 h-5 text-background dark:text-black" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}