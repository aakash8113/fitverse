import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, CreditCard, Banknote, Wallet, Tag, Coins } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cartApi, ordersApi, paymentApi, coinsApi, couponsApi, CouponValidationResult } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Razorpay global type
declare global {
  interface Window {
    Razorpay: any;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PAYMENT_OPTIONS = [
  { id: "COD" as const, label: "Cash on Delivery", icon: Banknote, description: "Pay when your order arrives" },
  { id: "CARD" as const, label: "Card / UPI", icon: CreditCard, description: "Credit / Debit / UPI / Wallet" },
];

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const selectedAddressId = searchParams.get("addressId") || "";

  const buyNowProductId: string | undefined = (location.state as any)?.buyNowProductId;
  const appliedCoupon: CouponValidationResult | null = (location.state as any)?.appliedCoupon ?? null;

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "CARD">("COD");
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.getCart,
  });

  const { data: coinsData } = useQuery({
    queryKey: ["coins"],
    queryFn: coinsApi.getHistory,
    enabled: !!user,
  });

  const allCartItems = cartData?.data?.items || [];
  const cartItems = buyNowProductId
    ? allCartItems.filter((item) => item.productId === buyNowProductId)
    : allCartItems;

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const shipping = 0; // FREE shipping
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const coinBalance = coinsData?.data?.coinBalance || 0;

  const afterCouponTotal = Math.max(0, subtotal + shipping - couponDiscount);
  const maxCoins = Math.min(coinBalance, Math.ceil(afterCouponTotal));
  const total = Math.max(0, afterCouponTotal - coinsToUse);
  const orderTotal = subtotal + shipping;

  // Create order mutation (for COD)
  const createOrderMutation = useMutation({
    mutationFn: (data: {
      addressId: string;
      paymentMethod: string;
      productIds?: string[];
      coinsToUse?: number;
      couponCode?: string;
    }) => ordersApi.createOrder(data as any),
    onSuccess: (result) => {
      setSubmitting(false);
      navigate(`/order-confirmation?orderId=${result.data?.id}`);
    },
    onError: (error: any) => {
      setSubmitting(false);
      toast({
        title: "Order Failed",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Load Razorpay script
  const loadRazorpayScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.body.appendChild(script);
    });
  }, []);

  const handleRazorpayPayment = async () => {
    if (!selectedAddressId) {
      toast({ title: "Address Required", description: "Please select an address first.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Load Razorpay script
      await loadRazorpayScript();

      // Step 2: Create order via backend
      const payload: Parameters<typeof paymentApi.initiateOnlinePayment>[0] = {
        addressId: selectedAddressId,
        paymentMethod: "CARD",
        productIds: buyNowProductId ? [buyNowProductId] : undefined,
        coinsToUse: total > 0 ? coinsToUse : 0,
        couponCode: appliedCoupon?.coupon.code || undefined,
      };

      const result = await paymentApi.initiateOnlinePayment(payload);
      const { razorpayOrderId, receipt, total: amount } = result.data;

      // If paid with coins, redirect to confirmation
      if (result.data.paidWithCoins) {
        navigate(`/order-confirmation?orderId=${result.data.orderId}`);
        return;
      }

      // Step 3: Open Razorpay Checkout
      // Razorpay Checkout automatically shows all available payment methods
      // (UPI, Card, Net Banking, Wallet) based on merchant account configuration
      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "Fitverse",
        description: "Order Payment",
        order_id: razorpayOrderId,
        image: "https://res.cloudinary.com/dw1mjqbbj/image/upload/v1773408756/logo_white_huzakb.png",
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: {
          receipt: receipt,
        },
        theme: {
          color: "#000000",
        },
        handler: async function (response: any) {
          // Payment successful — verify on backend (creates DB order)
          try {
            const verifyResult = await paymentApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              receipt: receipt,
            });
            navigate(`/order-confirmation?orderId=${verifyResult.data?.orderId}`);
          } catch (verifyError: any) {
            toast({
              title: "Payment Verification Failed",
              description: verifyError.response?.data?.message || "Could not verify payment. Please try again.",
              variant: "destructive",
            });
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            // User closed Razorpay modal without completing payment
            // No DB order exists — safe to just reset
            setSubmitting(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      setSubmitting(false);
      toast({
        title: "Payment Failed",
        description: error.response?.data?.message || "Could not initiate payment.",
        variant: "destructive",
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast({ title: "Address Required", description: "Please select an address first.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    if (paymentMethod === "CARD") {
      await handleRazorpayPayment();
    } else {
      // COD
      const payload = {
        addressId: selectedAddressId,
        paymentMethod: "COD",
        productIds: buyNowProductId ? [buyNowProductId] : undefined,
        coinsToUse: total > 0 ? coinsToUse : 0,
        couponCode: appliedCoupon?.coupon.code || undefined,
      };
      await createOrderMutation.mutateAsync(payload);
    }
  };

  const steps = [
    { number: 1, label: "Cart" },
    { number: 2, label: "Address" },
    { number: 3, label: "Payment" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container md:max-w-full md:px-8 lg:px-12 xl:px-16 py-8 lg:py-12">
        {/* Header: Back button + Progress Steps */}
        <div className="flex items-center mb-8">
          <div className="flex-1">
            <Link to={`/checkout?addressId=${selectedAddressId}`}>
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
                      step.number === 3
                        ? "bg-foreground text-background"
                        : step.number < 3
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {step.number}
                  </div>
                  <span
                    className={cn(
                      "font-medium transition-colors hidden sm:block",
                      step.number === 3 ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-12 lg:w-20 h-0.5 bg-border mx-3 lg:mx-6" />
                )}
              </div>
            ))}
          </div>
          <div className="flex-1" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Payment Options */}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
              <p className="text-muted-foreground">Choose how you'd like to pay</p>
            </div>

            <div className="space-y-4">
              {PAYMENT_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  onClick={() => setPaymentMethod(option.id)}
                  className={cn(
                    "flex items-start p-4 lg:p-5 border-2 rounded-xl cursor-pointer transition-all",
                    paymentMethod === option.id
                      ? "border-foreground bg-secondary"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 mr-4",
                      paymentMethod === option.id
                        ? "border-foreground"
                        : "border-muted-foreground"
                    )}
                  >
                    {paymentMethod === option.id && (
                      <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                    )}
                  </div>
                  <option.icon className="w-5 h-5 mt-0.5 mr-3 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fitverse Coins */}
            {coinBalance > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold">Use Fitverse Coins</h3>
                  <span className="text-sm text-muted-foreground ml-auto">{coinBalance} coins available</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Each coin = ₹1. You can use up to {maxCoins} coins.
                </p>
                <input
                  type="range"
                  min={0}
                  max={maxCoins}
                  value={coinsToUse}
                  onChange={(e) => setCoinsToUse(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm">
                  <span>Coins to use:</span>
                  <span className="font-semibold">{coinsToUse} coins = ₹{coinsToUse}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-bold">Order Summary</h2>

                {/* Order Items */}
                <div className="space-y-4 max-h-48 overflow-y-auto">
                  {cartItems.map((item) => {
                    const imageUrl = item.product.images?.[0]?.startsWith("http")
                      ? item.product.images[0]
                      : `http://localhost:5000/${item.product.images?.[0] || ""}`;

                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <img
                            src={imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/56?text=No+Image";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate">{item.product.name}</h3>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold">₹{(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">FREE</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        {appliedCoupon!.coupon.code}
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {coinsToUse > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5" />
                        Coins Used
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">-₹{coinsToUse.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <div className="text-right">
                      {(couponDiscount > 0 || coinsToUse > 0) && (
                        <p className="text-xs text-muted-foreground line-through">
                          ₹{(orderTotal).toFixed(2)}
                        </p>
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
                  disabled={!selectedAddressId || submitting || cartItems.length === 0}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : paymentMethod === "COD" ? (
                    `Place Order · ₹${total.toFixed(2)}`
                  ) : (
                    `Pay ₹${total.toFixed(2)}`
                  )}
                </Button>

                {/* Trust Badges */}
                <div className="pt-4 space-y-2 text-xs text-muted-foreground text-center">
                  <p className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    </span>
                    Secure checkout with Razorpay
                  </p>
                  <p>Free returns within 3 days</p>
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