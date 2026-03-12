import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, Tag, Loader2, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi, couponsApi, CouponValidationResult } from "@/services/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const navigate = useNavigate();
  const [currentStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Fetch cart data
  const { data: cartData, isLoading, error } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.getCart,
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      cartApi.updateCartItem(cartItemId, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: (cartItemId: string) => cartApi.removeFromCart(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ cartItemId, quantity: newQuantity });
  };

  const removeItem = (cartItemId: string) => {
    removeItemMutation.mutate(cartItemId);
  };

  // Coupon handlers
  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    try {
      const result = await couponsApi.validateCoupon({ couponCode: code });
      if (result.data) {
        setAppliedCoupon(result.data);
        toast({
          title: "Coupon Applied!",
          description: `${result.data.coupon.code} — ₹${result.data.discountAmount.toFixed(2)} off`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Invalid Coupon",
        description: err.response?.data?.message || "This coupon code is not valid",
        variant: "destructive",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
  };

  const handleProceedToCheckout = () => {
    navigate("/checkout", {
      state: appliedCoupon ? { appliedCoupon } : undefined,
    });
  };

  // Calculate totals
  const cartItems = cartData?.data?.items || [];
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your cart...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-container py-12">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2 text-destructive">Error Loading Cart</h2>
            <p className="text-muted-foreground mb-6">
              {(error as Error).message || "Failed to load cart. Please try again."}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
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
            <Link to="/shop">
              <Button variant="outline" className="gap-2 hover:bg-foreground hover:text-background transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Shopping
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

        {cartItems.length === 0 ? (
          // Empty Cart
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added anything to your cart yet
            </p>
            <Link to="/shop">
              <Button size="lg" className="gap-2">
                Continue Shopping
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          // Cart with Items
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left: Cart Items */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Shopping Cart</h2>
                <p className="text-muted-foreground">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
                </p>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => {
                  const imageUrl = item.product.images?.[0]?.startsWith("http")
                    ? item.product.images[0]
                    : `http://localhost:5000/${item.product.images?.[0] || ""}`;

                  return (
                    <div
                      key={item.id}
                      className="bg-card border border-border rounded-2xl p-4 lg:p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <Link
                          to={`/product/${item.product.id}`}
                          className="flex-shrink-0 w-24 h-24 lg:w-28 lg:h-28 rounded-xl overflow-hidden bg-secondary"
                        >
                          <img
                            src={imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/100?text=No+Image";
                            }}
                          />
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-4 mb-2">
                            <Link to={`/product/${item.product.id}`}>
                              <h3 className="font-semibold text-base lg:text-lg hover:text-primary transition-colors">
                                {item.product.name}
                              </h3>
                            </Link>
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={removeItemMutation.isPending}
                              className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                              aria-label="Remove item"
                            >
                              {removeItemMutation.isPending &&
                              removeItemMutation.variables === item.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                            <span>
                              Category:{" "}
                              <span className="text-foreground font-medium">
                                {item.product.category}
                              </span>
                            </span>
                            {/* Always show size — empty string means "no size on record" */}
                            <span>
                              Size:{" "}
                              {item.size ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-foreground text-background text-xs font-bold tracking-wide">
                                  {item.size}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-medium">—</span>
                              )}
                            </span>
                            <span>
                              Price:{" "}
                              <span className="text-foreground font-medium">
                                ₹{Number(item.product.price).toFixed(2)}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <span className="text-xl font-bold">
                              ₹{(Number(item.product.price) * item.quantity).toFixed(2)}
                            </span>

                            {/* Quantity Controls */}
                            <div className="flex items-center border-2 border-border rounded-lg">
                              <button
                                onClick={() => {
                                  if (item.quantity <= 1) {
                                    removeItem(item.id);
                                  } else {
                                    updateQuantity(item.id, item.quantity - 1);
                                  }
                                }}
                                disabled={updateQuantityMutation.isPending || removeItemMutation.isPending}
                                className="p-2 hover:bg-secondary transition-colors disabled:opacity-50"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={updateQuantityMutation.isPending}
                                className="p-2 hover:bg-secondary transition-colors disabled:opacity-50"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>


            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 lg:mt-20">
                <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                  <h2 className="text-xl font-bold">Order Summary</h2>

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

                  {/* Coupon Code */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Coupon Code</p>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 px-3 py-2">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                          <Tag className="h-4 w-4" />
                          <span className="text-sm font-semibold">{appliedCoupon.coupon.code}</span>
                          <span className="text-xs">— ₹{appliedCoupon.discountAmount.toFixed(2)} off</span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-green-600 hover:text-red-500 transition-colors"
                          aria-label="Remove coupon"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          className="flex-1 h-9 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={handleApplyCoupon}
                          disabled={!couponInput.trim() || couponLoading}
                        >
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Checkout Button */}
                  <Button size="lg" className="w-full text-base font-semibold gap-2" onClick={handleProceedToCheckout}>
                    Proceed to Checkout
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
        )}
      </div>

      <Footer />
    </div>
  );
}
