import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CreditCard, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cartApi, ordersApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function Payment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const addressId = searchParams.get("addressId") || "";
  const [currentStep] = useState(3);
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.getCart,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (response) => {
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

  const cartItems = cartData?.data?.items || [];
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const shipping = subtotal > 0 ? 15.0 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

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
      await createOrderMutation.mutateAsync({
        addressId,
        paymentMethod: paymentMethod as "COD" | "CARD" | "WALLET",
      });
    } catch {
      // handled in onError
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
                          <span className="text-xl">💵</span>
                          <span className="font-semibold">Cash on Delivery</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pay with cash when your order is delivered
                        </p>
                      </Label>
                    </div>
                  </div>

                  {/* Credit / Debit Card */}
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
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pay securely with Visa, Mastercard, or Amex
                        </p>
                      </Label>
                    </div>
                  </div>

                  {/* Digital Wallet */}
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
                          <span className="text-xl">👛</span>
                          <span className="font-semibold">Digital Wallet</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pay with Apple Pay, Google Pay, or your digital wallet
                        </p>
                      </Label>
                    </div>
                  </div>
                </div>
              </RadioGroup>
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
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold mt-1">
                            ${(Number(item.product.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  size="lg"
                  className="w-full text-base font-semibold gap-2"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order
                      <ArrowRight className="w-5 h-5" />
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
                  <p>Free returns within 30 days</p>
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
