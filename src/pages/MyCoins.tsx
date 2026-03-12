import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useQuery } from "@tanstack/react-query";
import { coinsApi, CoinTransaction } from "@/services/api";
import { Loader2, TrendingUp, TrendingDown, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FitverseCoinIcon } from "@/components/shared/FitverseCoinIcon";
import coinWhite from "@/assets/about/coin_white.png";

const TYPE_CONFIG: Record<CoinTransaction["type"], { label: string; icon: JSX.Element; color: string }> = {
  THRIFT_REWARD: {
    label: "Thrift Reward",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-green-600",
  },
  ORDER_PAYMENT: {
    label: "Order Payment",
    icon: <TrendingDown className="h-4 w-4" />,
    color: "text-red-500",
  },
  ADMIN_ADJUSTMENT: {
    label: "Admin Adjustment",
    icon: <Settings2 className="h-4 w-4" />,
    color: "text-blue-500",
  },
};

export default function MyCoins() {
  const { data, isLoading } = useQuery({
    queryKey: ["coins", "history"],
    queryFn: coinsApi.getHistory,
  });

  const coinBalance = data?.data?.coinBalance ?? 0;
  const transactions: CoinTransaction[] = data?.data?.transactions ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-10 max-w-2xl mx-auto">
        {/* Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white p-8 mb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <img src={coinWhite} alt="" aria-hidden="true" className="h-10 w-10 object-contain" />
            <h1 className="text-2xl font-bold">Fitverse Coins</h1>
          </div>
          <p className="text-yellow-100 text-sm mb-4">1 Fitverse Coin = ₹1 off your order</p>
          <div className="text-5xl font-extrabold tracking-tight">
            {isLoading ? "—" : coinBalance.toLocaleString("en-IN")}
          </div>
          <p className="text-yellow-100 text-sm mt-1">coins available</p>
        </div>

        {/* How to earn */}
        <div className="rounded-xl border p-5 mb-8">
          <h2 className="font-semibold text-base mb-3">How to earn Fitverse Coins</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 font-bold mt-0.5">•</span>
              <span>Sell clothes through our <span className="font-medium text-foreground">Thrift Store</span>. When your items are picked up, you earn coins equal to their offer price.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 font-bold mt-0.5">•</span>
              Coins never expire and can be used to pay for any order — fully or partially.
            </li>
          </ul>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="font-bold text-lg mb-4">Transaction History</h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FitverseCoinIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No transactions yet.</p>
              <p className="text-sm mt-1">Sell clothes via Thrift to earn your first coins!</p>
            </div>
          ) : (
            <div className="space-y-0 rounded-xl border overflow-hidden">
              {transactions.map((tx, idx) => {
                const config = TYPE_CONFIG[tx.type] ?? {
                  label: tx.type,
                  icon: <FitverseCoinIcon className="h-4 w-4" />,
                  color: "text-muted-foreground",
                };
                const isCredit = tx.amount > 0;

                return (
                  <div key={tx.id}>
                    {idx > 0 && <Separator />}
                    <div className="flex items-center gap-4 p-4">
                      <div
                        className={cn(
                          "rounded-full p-2",
                          isCredit
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                            : "bg-red-100 text-red-500 dark:bg-red-900/30"
                        )}
                      >
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "text-base font-bold tabular-nums",
                          isCredit ? "text-green-600" : "text-red-500"
                        )}
                      >
                        {isCredit ? "+" : ""}
                        {tx.amount} coins
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
