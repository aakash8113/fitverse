import { useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, CreditCard, Loader2, Tag, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi, ordersApi, paymentApi, CouponValidationResult } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { FitverseCoinIcon } from "@/components/shared/FitverseCoinIcon";

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const addressId = searchParams.get("addressId") || "";
  const [currentStep] = useState(3);
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");
  const [useCoins, setUseCoins] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const buyNowProductId: string | undefined = (location.state as any)?.buyNowProductId;
  const appliedCoupon: CouponValidationResult | null = (location.state as any)?.appliedCoupon ?? null;

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.getCart,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Order Placed!",
        description: "Your order has been placed successfully",
      });
      navigate(`/order-confirmation?orderId=${response.data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const allCartItems = cartData?.data?.items || [];
  const cartItems = buyNowProductId
    ? allCartItems.filter((item) => item.productId === buyNowProductId)
    : allCartItems;
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const shipping = subtotal > 0 ? 15.0 : 0;

  // Coupon discount is applied before coins
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const afterCouponTotal = Math.max(0, subtotal + shipping - couponDiscount);

  // Fitverse Coins
  const coinBalance = user?.coinBalance ?? 0;
  const coinsToApply = useCoins ? Math.min(coinBalance, Math.ceil(afterCouponTotal)) : 0;
  const total = Math.max(0, afterCouponTotal - coinsToApply);
  const fullyPaidByCoins = total === 0 && coinsToApply > 0;

  // For strikethrough display — original before any discounts
  const orderTotal = subtotal + shipping;

  const steps = [
    { number: 1, label: "Cart" },
    { number: 2, label: "Address" },
    { number: 3, label: "Payment" },
  ];

  const handlePlaceOrder = async () => {
    if (!addressId) {
      toast({
        title: "Address Missing",
        description: "Please go back and select a delivery address",
        variant: "destructive",
      });
      navigate("/checkout");
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (paymentMethod === "COD" || fullyPaidByCoins) {
        // COD or fully paid by coins: create order immediately
        await createOrderMutation.mutateAsync({
          addressId,
          paymentMethod: fullyPaidByCoins ? "COINS" : "COD",
          ...(buyNowProductId ? { productIds: [buyNowProductId] } : {}),
          coinsToUse: coinsToApply,
          couponCode: appliedCoupon?.coupon.code,
        });
      } else {
        // CARD / WALLET: create a pending order and redirect to PhonePe
        const response = await paymentApi.initiateOnlinePayment({
          addressId,
          paymentMethod: paymentMethod as "CARD" | "WALLET",
          ...(buyNowProductId ? { productIds: [buyNowProductId] } : {}),
          coinsToUse: coinsToApply,
          couponCode: appliedCoupon?.coupon.code,
        });
        // Navigate user to PhonePe hosted checkout
        window.location.href = response.data.redirectUrl;
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container md:max-w-full md:px-8 lg:px-12 xl:px-16 py-8 lg:py-12">
        {/* Header: Back button + Progress Steps */}
        <div className="flex items-center mb-8">
          <div className="flex-1">
            <Link to={`/checkout`}>
              <Button variant="outline" className="gap-2 hover:bg-foreground hover:text-background transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Address
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4 lg:gap-8">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
                      step.number === currentStep
                        ? "bg-foreground text-background"
                        : step.number < currentStep
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {step.number < currentStep ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={cn(
                      "font-medium transition-colors hidden sm:block",
                      step.number === currentStep ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-12 lg:w-20 h-0.5 bg-foreground/30 mx-3 lg:mx-6" />
                )}
              </div>
            ))}
          </div>
          <div className="flex-1" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Payment Method */}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
              <p className="text-muted-foreground mb-6">Choose how you'd like to pay</p>

              {fullyPaidByCoins ? (
                <div className="border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-5 flex items-center gap-3">
                  <FitverseCoinIcon className="h-7 w-7 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-800 dark:text-yellow-300">Paying with Fitverse Coins</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">Your coins cover the full order total — no additional payment needed.</p>
                  </div>
                </div>
              ) : (
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  {/* Cash on Delivery */}
                  <div
                    className={cn(
                      "border-2 rounded-xl p-4 cursor-pointer transition-all",
                      paymentMethod === "COD"
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/50"
                    )}
                    onClick={() => setPaymentMethod("COD")}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="COD" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Cash on Delivery</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pay with cash when your order is delivered
                        </p>
                      </Label>
                    </div>
                  </div>

                  {/* Pay Online via PhonePe — Cards */}
                  <div
                    className={cn(
                      "border-2 rounded-xl p-4 cursor-pointer transition-all",
                      paymentMethod === "CARD"
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/50"
                    )}
                    onClick={() => setPaymentMethod("CARD")}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="CARD" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="font-semibold">Credit / Debit Card</span>
                          <span className="ml-auto text-xs font-medium text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">via PhonePe</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pay securely with Visa, Mastercard, RuPay & more
                        </p>
                      </Label>
                    </div>
                  </div>

                  {/* Pay Online via PhonePe — UPI / Wallets */}
                  <div
                    className={cn(
                      "border-2 rounded-xl p-4 cursor-pointer transition-all",
                      paymentMethod === "WALLET"
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/50"
                    )}
                    onClick={() => setPaymentMethod("WALLET")}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="WALLET" id="wallet" />
                      <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">UPI / PhonePe Wallet</span>
                          <span className="ml-auto text-xs font-medium text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">via PhonePe</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pay with any UPI app, PhonePe or digital wallet
                        </p>
                      </Label>
                    </div>
                  </div>
                </div>
              </RadioGroup>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-bold">Order Summary</h2>

                {/* Order Items */}
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => {
                    const imageUrl = item.product.images?.[0]?.startsWith("http")
                      ? item.product.images[0]
                      : `http://localhost:5000/${item.product.images?.[0] || ""}`;

                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/64?text=No+Image";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate">{item.product.name}</h3>
                          {item.size && (
                            <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                          )}
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold mt-1">
                            ₹{(Number(item.product.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Applied coupon badge (read-only, set on cart page) */}
                {appliedCoupon && (
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 px-3 py-2">
                    <Tag className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-semibold">{appliedCoupon.coupon.code}</span>
                    <span className="text-xs">— ₹{appliedCoupon.discountAmount.toFixed(2)} off</span>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">₹{shipping.toFixed(2)}</span>
                  </div>

                  {/* Coupon discount line */}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        {appliedCoupon!.coupon.code}
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Fitverse Coins Toggle */}
                  {coinBalance > 0 && (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FitverseCoinIcon className="h-4 w-4" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                              Fitverse Coins
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">
                              {coinBalance} coins available (₹{coinBalance} off)
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={useCoins}
                          onCheckedChange={setUseCoins}
                          className="data-[state=checked]:bg-yellow-500"
                        />
                      </div>
                      {useCoins && (
                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800">
                          <span className="text-yellow-700 dark:text-yellow-300 font-medium">Coins discount</span>
                          <span className="text-yellow-700 dark:text-yellow-300 font-semibold">-₹{coinsToApply.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <div className="text-right">
                      {(coinsToApply > 0 || couponDiscount > 0) && (
                        <p className="text-xs text-muted-foreground line-through">₹{orderTotal.toFixed(2)}</p>
                      )}
                      <span className="font-bold">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  size="lg"
                  className="w-full text-base font-semibold gap-2"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || createOrderMutation.isPending}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {fullyPaidByCoins ? "Placing Order..." : paymentMethod === "COD" ? "Placing Order..." : "Redirecting to PhonePe..."}
                    </>
                  ) : (
                    <>
                      {fullyPaidByCoins ? (
                        <>
                          <FitverseCoinIcon className="w-4 h-4" />
                          Pay with Fitverse Coins
                        </>
                      ) : paymentMethod === "COD" ? "Place Order" : "Proceed to PhonePe"}
                      {!fullyPaidByCoins && <ArrowRight className="w-5 h-5" />}
                    </>
                  )}
                </Button>

                {/* Trust Badges */}
                <div className="space-y-2 text-xs text-muted-foreground text-center">
                  <p className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    </span>
                    Secure checkout — your data is safe
                  </p>
                  <p>Free returns within 7 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
