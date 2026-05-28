import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { creditsApi } from "@/services/api";

type PollState = "polling" | "paid" | "failed" | "timeout";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_DURATION_MS = 90000;

export default function CreditsReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const purchaseId = searchParams.get("purchaseId") || "";

  const [pollState, setPollState] = useState<PollState>("polling");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const startTime = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!purchaseId) {
      setErrorMsg("No purchase ID found. Please try again.");
      setPollState("failed");
      return;
    }

    const poll = async () => {
      try {
        const response = await creditsApi.getPurchaseStatus(purchaseId);
        const status = response.data?.purchase?.status;

        if (status === "COMPLETED") {
          clearInterval(intervalRef.current!);
          setPollState("paid");
          setTimeout(() => navigate("/fitverse-ai"), 1500);
          return;
        }

        if (status === "FAILED") {
          clearInterval(intervalRef.current!);
          setPollState("failed");
          setErrorMsg("Your payment was not completed. Please try again.");
          return;
        }

        if (Date.now() - startTime.current > MAX_POLL_DURATION_MS) {
          clearInterval(intervalRef.current!);
          setPollState("timeout");
        }
      } catch (err: any) {
        clearInterval(intervalRef.current!);
        setErrorMsg(err.response?.data?.message || "Unable to verify payment status.");
        setPollState("failed");
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [purchaseId, navigate]);

  const renderContent = () => {
    switch (pollState) {
      case "polling":
        return (
          <div className="text-center space-y-5">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Verifying your payment…</h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Please wait while we confirm your payment. Do not close this tab.
            </p>
          </div>
        );
      case "paid":
        return (
          <div className="text-center space-y-5">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Credits added successfully!</h1>
            <p className="text-muted-foreground text-sm">Redirecting you back to Fitverse AI…</p>
          </div>
        );
      case "failed":
        return (
          <div className="text-center space-y-6">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Payment Failed</h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {errorMsg || "Something went wrong with your payment."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate(-1)} variant="outline">
                Try Again
              </Button>
              <Button asChild>
                <Link to="/credits/buy">Buy Credits</Link>
              </Button>
            </div>
          </div>
        );
      case "timeout":
        return (
          <div className="text-center space-y-6">
            <Clock className="w-16 h-16 text-amber-500 mx-auto" />
            <h1 className="text-2xl font-bold">Payment Pending</h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We are still waiting for confirmation. Your payment may still go through — try again shortly.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { startTime.current = Date.now(); setPollState("polling"); }} variant="outline">
                Check Again
              </Button>
              <Button asChild>
                <Link to="/credits/buy">Buy Credits</Link>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-container py-20 flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-10 shadow-sm">
          {renderContent()}
        </div>
      </div>
      <Footer />
    </div>
  );
}
