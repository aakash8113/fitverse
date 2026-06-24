import { Sparkles, Shield, Zap, Eye } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { creditsApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AITryOn, TryOnPrefill } from "../components/ai/AITryOn.tsx";
import { CreditPurchaseDialog } from "../components/ai/CreditPurchaseDialog";

const benefits = [
  {
    icon: Zap,
    title: "Instant Results",
    description: "Instantly visualize your look with virtual try-on",
  },
  {
    icon: Eye,
    title: "Ultra Realistic",
    description: "AI-generated results that look natural",
  },
  {
    icon: Shield,
    title: "Secure Processing",
    description: "Your images are handled safely during try-on",
  },
];

export default function FitverseAI() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const { data: creditsData, isLoading: creditsLoading, refetch } = useQuery({
    queryKey: ["credits", "balance"],
    queryFn: creditsApi.getBalance,
    retry: false,
    enabled: isAuthenticated,
  });
  const creditsAvailable = isAuthenticated ? (creditsData?.data?.aiCredits ?? 0) : 0;

  const prefill = useMemo<TryOnPrefill | null>(() => {
    const statePrefill = (location.state as { tryOnPrefill?: TryOnPrefill } | null)?.tryOnPrefill;
    if (statePrefill) return statePrefill;
    const stored = sessionStorage.getItem("fitverse_tryon_prefill");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as TryOnPrefill;
    } catch {
      return null;
    }
  }, [location.state]);

  useEffect(() => {
    if (prefill) {
      sessionStorage.removeItem("fitverse_tryon_prefill");
    }
  }, [prefill]);

  return (
    <div className="min-h-screen bg-background cursor-default">
      <Navbar />

      {/* Try-On Interface */}
      <section className="py-12">
        <div className="section-container">
          <div className="bg-card rounded-3xl border border-border/50 p-8 lg:p-12 shadow-soft">
            <div className="flex items-center justify-end mb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-border/60 bg-secondary/50">
                  <Sparkles className="w-4 h-4 text-foreground" />
                  <span className="text-sm font-semibold">
                    {creditsLoading ? "—" : creditsAvailable}
                  </span>
                  <span className="text-xs text-muted-foreground">credits</span>
                </div>
                <Button size="sm" onClick={() => setCreditDialogOpen(true)}>
                  Buy credits
                </Button>
              </div>
            </div>
            <AITryOn
              availableCredits={isAuthenticated ? creditsAvailable : undefined}
              onCreditsRefresh={refetch}
              prefill={prefill}
            />
          </div>
        </div>
      </section>


      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        
        

        <div className="section-container relative z-10 bg-blue-100 dark:bg-card rounded-3xl p-10 sm:p-14 lg:p-16 shadow-soft dark:bg-[#242F4A]">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Fitverse AI Try-On
              <br />
              <span className="gradient-ai-text">Powered by AI</span>
            </h1>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
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
                <div className="w-12 h-12 rounded-xl bg-foreground dark:bg-white flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-white dark:text-black" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-foreground/70">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
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
                <div className="w-20 h-20 rounded-3xl bg-foreground dark:bg-white flex items-center justify-center mx-auto mb-6 shadow-ai">
                  <span className="text-2xl font-bold text-white dark:text-black">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* ─── Credit Purchase Dialog ─── */}
      <CreditPurchaseDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
