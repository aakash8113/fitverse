import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Tag } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { cartApi, CouponValidationResult } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { AddressSelector } from "@/components/shared/AddressSelector";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [currentStep] = useState(2); // Address step
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const buyNowProductId: string | undefined = (location.state as any)?.buyNowProductId;
  const appliedCoupon: CouponValidationResult | null = (location.state as any)?.appliedCoupon ?? null;

  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.getCart,
  });

  const allCartItems = cartData?.data?.items || [];
  // For buy-now, only show the specific product
  const cartItems = buyNowProductId
    ? allCartItems.filter((item) => item.productId === buyNowProductId)
    : allCartItems;
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const shipping = subtotal > 0 ? 15.0 : 0;
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + shipping - couponDiscount);
  const orderTotal = subtotal + shipping;

  const steps = [
    { number: 1, label: "Cart" },
    { number: 2, label: "Address" },
    { number: 3, label: "Payment" },
  ];

  const handleContinueToPayment = () => {
    if (!selectedAddressId) {
      toast({
        title: "Address Required",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }
    navigate(`/payment?addressId=${selectedAddressId}`, {
      state: {
        ...(buyNowProductId ? { buyNowProductId } : {}),
        ...(appliedCoupon ? { appliedCoupon } : {}),
      },
    });
  };

  // Loading state
  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Empty cart redirect (skip check for buy-now flow)
  if (!buyNowProductId && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-container py-12">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add items to cart before checkout</p>
            <Link to="/shop">
              <Button>Continue Shopping</Button>
            </Link>
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
            <Link to="/cart">
              <Button variant="outline" className="gap-2 hover:bg-foreground hover:text-background transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Cart
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
                    {step.number}
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
                  <div className="w-12 lg:w-20 h-0.5 bg-border mx-3 lg:mx-6" />
                )}
              </div>
            ))}
          </div>
          <div className="flex-1" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Address Section */}
          <div className="lg:col-span-3 space-y-8">
            {/* Shipping Address */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">Shipping Address</h2>
                <p className="text-muted-foreground">Select or add a delivery address</p>
              </div>

              <AddressSelector
                selectedId={selectedAddressId}
                onSelect={setSelectedAddressId}
                variant="dark"
              />
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

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        {appliedCoupon!.coupon.code}
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <div className="text-right">
                      {couponDiscount > 0 && (
                        <p className="text-xs text-muted-foreground line-through">₹{orderTotal.toFixed(2)}</p>
                      )}
                      <span className="font-bold">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Continue to Payment Button */}
                <Button
                  size="lg"
                  className="w-full text-base font-semibold gap-2"
                  onClick={handleContinueToPayment}
                  disabled={!selectedAddressId}
                >
                  Continue to Payment
                  <ArrowRight className="w-5 h-5" />
                </Button>

                {/* Trust Badges */}
                <div className="pt-4 space-y-2 text-xs text-muted-foreground text-center">
                  <p className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    </span>
                    Secure checkout
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
