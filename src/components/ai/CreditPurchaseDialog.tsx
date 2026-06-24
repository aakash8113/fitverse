import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles, Zap, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { creditsApi, AiCreditPack } from "@/services/api";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

const CREDIT_PACKS = [
  { credits: 10, price: 60, label: "Starter", icon: Zap, desc: "Perfect for trying out AI try-on" },
  { credits: 50, price: 250, label: "Popular", icon: Star, desc: "Best value for regular users", popular: true },
  { credits: 100, price: 450, label: "Pro", icon: Crown, desc: "For frequent shoppers" },
];

interface CreditPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreditPurchaseDialog({ open, onOpenChange, onSuccess }: CreditPurchaseDialogProps) {
  const [activePack, setActivePack] = useState<number | null>(null);

  const { data: balanceData } = useQuery({
    queryKey: ["credits", "balance"],
    queryFn: creditsApi.getBalance,
    retry: false,
    enabled: open,
  });

  const creditsAvailable = balanceData?.data?.aiCredits ?? 0;

  const handleBuy = async (packIndex: number) => {
    try {
      setActivePack(packIndex);
      const pack = CREDIT_PACKS[packIndex];
      
      // Fetch packs from API to get the matching pack ID
      const packsResponse = await creditsApi.getPacks();
      const packs: AiCreditPack[] = packsResponse?.data || [];
      
      // Find matching pack by credits count
      const matchingPack = packs.find((p) => p.credits === pack.credits);
      
      if (!matchingPack) {
        toast({
          title: "Pack not found",
          description: `The ${pack.credits}-credit pack is not available. Please try again later.`,
          variant: "destructive",
        });
        setActivePack(null);
        return;
      }

      // Initiate the purchase — backend creates Razorpay order
      const response = await creditsApi.initiatePurchase(matchingPack.id);
      const { razorpayOrderId, amount, purchaseId } = response.data || {};
      
      if (!razorpayOrderId) {
        throw new Error("No Razorpay order ID returned");
      }

      // Open Razorpay checkout
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_T33O6zfzAQIRRb";
      
      const options = {
        key: razorpayKey,
        amount: amount * 100, // amount in paise
        currency: "INR",
        name: "Fitverse",
        description: `${pack.credits} AI Credits`,
        image: "https://res.cloudinary.com/dw1mjqbbj/image/upload/v1773408756/logo_white_huzakb.png",
        order_id: razorpayOrderId,
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        handler: async function (response: any) {
          // Payment successful — verify on backend
          try {
            const verifyRes = await creditsApi.verifyPurchase({
              purchaseId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verifyRes.success) {
              toast({
                title: "Credits added!",
                description: `${pack.credits} credits have been added to your account.`,
              });
              onSuccess?.();
              onOpenChange(false);
            }
          } catch (verifyErr: any) {
            toast({
              title: "Verification failed",
              description: verifyErr.response?.data?.message || "Please contact support if credits are not added.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function () {
            setActivePack(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast({
          title: "Payment failed",
          description: response.error?.description || "Payment was not completed.",
          variant: "destructive",
        });
        setActivePack(null);
      });
      rzp.open();
    } catch (err: any) {
      toast({
        title: "Payment error",
        description: err.response?.data?.message || err.message || "Unable to start payment. Please try again.",
        variant: "destructive",
      });
      setActivePack(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Buy Fitverse AI Credits
          </DialogTitle>
          <DialogDescription>
            Standard try-on costs 1 credit. HD mode costs 2 credits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Current balance */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/60 bg-secondary/30">
            <span className="text-sm text-muted-foreground">Your balance</span>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-foreground" />
              <span className="text-lg font-bold">{creditsAvailable}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
          </div>

          {/* Credit packs */}
          <div className="grid grid-cols-1 gap-3">
            {CREDIT_PACKS.map((pack, index) => {
              const Icon = pack.icon;
              const isActive = activePack === index;
              return (
                <div
                  key={index}
                  className={cn(
                    "relative rounded-2xl border p-5 flex items-center gap-4 transition-all",
                    pack.popular
                      ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 bg-card hover:border-foreground/30"
                  )}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 left-4 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
                      Best value
                    </span>
                  )}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    pack.popular ? "bg-primary/10 text-primary" : "bg-secondary text-foreground"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{pack.label}</h4>
                    <p className="text-xs text-muted-foreground">{pack.desc}</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-lg font-bold">₹{pack.price}</span>
                      <span className="text-sm text-muted-foreground">
                        for <strong>{pack.credits}</strong> credits
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground mb-1">
                      ₹{(pack.price / pack.credits).toFixed(1)}/credit
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleBuy(index)}
                      disabled={isActive}
                      variant={pack.popular ? "default" : "outline"}
                    >
                      {isActive ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          Opening...
                        </>
                      ) : (
                        "Buy"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="text-xs text-muted-foreground text-center block">
          Secure payment via Razorpay. Credits are added instantly after successful payment.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}