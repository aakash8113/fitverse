import { Sparkles, Shield, Zap, Eye } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AITryOn } from "@/components/ai/AITryOn";

import heroAI from "@/assets/hero-ai.jpg";

const benefits = [
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get your virtual try-on in under 5 seconds",
  },
  {
    icon: Eye,
    title: "Ultra Realistic",
    description: "AI-generated results that look natural",
  },
  {
    icon: Shield,
    title: "100% Private",
    description: "Your photos are never stored or shared",
  },
];

export default function FitverseAI() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        
        

        <div className="section-container relative z-10 bg-blue-100 rounded-3xl p-10 sm:p-14 lg:p-16 shadow-soft">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Coming Soon
              <br />
              {/* <span className="gradient-ai-text">Powered by AI</span> */}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your photo, select any clothing item, and see exactly how it looks on you. 
              No more guessing, no more returns.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="flex items-center gap-4 bg-card rounded-2xl p-6 border border-border/50"
              >
                <div className="w-12 h-12 rounded-xl gradient-ai flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Try-On Interface */}
      {/* <section className="py-12">
        <div className="section-container">
          <div className="bg-card rounded-3xl border border-border/50 p-8 lg:p-12 shadow-soft">
            <AITryOn />
          </div>
        </div>
      </section> */}

      {/* How It Works */}
      <section className="py-24 bg-secondary/30">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to see how any clothing looks on you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Your Photo",
                description: "Take or upload a full-body photo. Our AI works best with front-facing images in good lighting.",
              },
              {
                step: "02",
                title: "Select Clothing",
                description: "Browse our collection and pick any item you want to try on. From casual to formal, we've got it all.",
              },
              {
                step: "03",
                title: "See the Result",
                description: "Watch as our AI generates a realistic preview of you wearing the selected outfit in seconds.",
              },
            ].map((item, index) => (
              <div key={item.step} className="text-center">
                <div className="w-20 h-20 rounded-3xl gradient-ai flex items-center justify-center mx-auto mb-6 shadow-ai">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
