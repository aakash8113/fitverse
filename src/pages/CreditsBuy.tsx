import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { creditsApi, AiCreditPack } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function CreditsBuy() {
  const [activePack, setActivePack] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: balanceData } = useQuery({
    queryKey: ["credits", "balance"],
    queryFn: creditsApi.getBalance,
    retry: false,
  });

  const { data: packsData, isLoading } = useQuery({
    queryKey: ["credits", "packs"],
    queryFn: creditsApi.getPacks,
    retry: false,
  });

  const packs: AiCreditPack[] = packsData?.data || [];
  const creditsAvailable = balanceData?.data?.aiCredits ?? 0;

  const handleBuy = async (packId: string) => {
    try {
      setActivePack(packId);
      const response = await creditsApi.initiatePurchase(packId);
      const redirectUrl = response.data?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err: any) {
      toast({
        title: "Payment error",
        description: err.response?.data?.message || "Unable to start payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActivePack(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Buy Fitverse AI Credits</h1>
              <p className="text-sm text-muted-foreground">Standard try-on costs 1 credit. HD costs 2 credits.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-border/60 bg-secondary/50">
              <Sparkles className="w-4 h-4 text-foreground" />
              <span className="text-sm font-semibold">{creditsAvailable}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading credit packs...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft flex flex-col gap-4"
                >
                  <div>
                    <h2 className="text-lg font-semibold">{pack.label}</h2>
                    <p className="text-xs text-muted-foreground">{pack.subtitle || ""}</p>
                  </div>
                  <div className="text-3xl font-bold">₹{pack.amount.toLocaleString("en-IN")}</div>
                  <div className="text-sm text-muted-foreground">{pack.credits} credits</div>
                  <Button
                    onClick={() => handleBuy(pack.id)}
                    disabled={activePack === pack.id}
                  >
                    {activePack === pack.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
                      </>
                    ) : (
                      "Buy now"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
