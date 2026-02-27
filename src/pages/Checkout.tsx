import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Plus, Check, CreditCard } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Address {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: "visa" | "mastercard" | "amex" | "discover";
  isDefault: boolean;
}

export default function Checkout() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2); // Address step
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("1");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>("1"); // Default to first card
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Saved addresses for testing
  const [savedAddresses] = useState<Address[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      addressLine1: "123 Fashion Street",
      addressLine2: "Apt 4B",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States",
      isDefault: true,
    },
    {
      id: "2",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      addressLine1: "456 Style Avenue",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "United States",
      isDefault: false,
    },
  ]);

  // Saved payment methods for testing
  const [savedPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      cardNumber: "**** **** **** 4242",
      cardholderName: "John Doe",
      expiryMonth: "12",
      expiryYear: "2025",
      cardType: "visa",
      isDefault: true,
    },
    {
      id: "2",
      cardNumber: "**** **** **** 5555",
      cardholderName: "John Doe",
      expiryMonth: "08",
      expiryYear: "2026",
      cardType: "mastercard",
      isDefault: false,
    },
  ]);

  // New address form state
  const [newAddress, setNewAddress] = useState<Omit<Address, "id" | "isDefault">>({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });

  // Billing address form state
  const [billingAddress, setBillingAddress] = useState<Omit<Address, "id" | "isDefault">>({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });

  const steps = [
    { number: 1, label: "Cart" },
    { number: 2, label: "Address" },
    { number: 3, label: "Payment" },
  ];

  // Mock cart data for order summary
  const subtotal = 816.00;
  const shipping = 15.00;
  const tax = 65.28;
  const total = 896.28;

  const handleContinueToPayment = () => {
    // Validate that an address is selected or form is filled
    if (!selectedAddressId && !showAddressForm) {
      alert("Please select an address or add a new one");
      return;
    }
    
    // Validate that a payment method is selected
    if (!selectedPaymentId) {
      alert("Please select a payment method");
      return;
    }
    
    // Navigate to order confirmation page
    console.log("Processing order with:", {
      address: selectedAddressId || newAddress,
      payment: selectedPaymentId
    });
    navigate("/order-confirmation");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container md:max-w-full md:px-8 lg:px-12 xl:px-16 py-8 lg:py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 lg:gap-8 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Address Section */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Shipping Address</h2>
              <p className="text-muted-foreground">
                Select a saved address or add a new one
              </p>
            </div>

            {/* Saved Addresses */}
            {!showAddressForm && (
              <div className="space-y-4">
                {savedAddresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={cn(
                      "bg-card border-2 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md",
                      selectedAddressId === address.id
                        ? "border-foreground"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5",
                            selectedAddressId === address.id
                              ? "border-foreground bg-foreground"
                              : "border-border"
                          )}
                        >
                          {selectedAddressId === address.id && (
                            <Check className="w-4 h-4 text-background" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{address.name}</h3>
                            {address.isDefault && (
                              <span className="text-xs px-2 py-1 bg-foreground text-background rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{address.email}</p>
                            <p>{address.phone}</p>
                            <p className="mt-2 text-foreground">
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                            </p>
                            <p className="text-foreground">
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p className="text-foreground">{address.country}</p>
                          </div>
                        </div>
                      </div>
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}

                {/* Add New Address Button */}
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="w-full border-2 border-dashed border-border rounded-2xl p-6 hover:border-foreground hover:bg-secondary/50 transition-all"
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Add New Address</span>
                  </div>
                </button>
              </div>
            )}

            {/* Add New Address Form */}
            {showAddressForm && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add New Address</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddressForm(false)}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={newAddress.name}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={newAddress.email}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    placeholder="123 Fashion Street"
                    value={newAddress.addressLine1}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, addressLine1: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Apt 4B (Optional)"
                    value={newAddress.addressLine2}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, addressLine2: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, state: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      placeholder="10001"
                      value={newAddress.zipCode}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, zipCode: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      placeholder="United States"
                      value={newAddress.country}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, country: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button className="w-full">Save Address</Button>
              </div>
            )}

            {/* Billing Address */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold">Billing Address</h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameAsBilling"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="sameAsBilling" className="cursor-pointer">
                  Same as shipping address
                </Label>
              </div>

              {/* Billing Address Form - Shows when checkbox is unchecked */}
              {!sameAsBilling && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billing-name">Full Name *</Label>
                      <Input
                        id="billing-name"
                        placeholder="John Doe"
                        value={billingAddress.name}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-phone">Phone Number *</Label>
                      <Input
                        id="billing-phone"
                        placeholder="+1 (555) 123-4567"
                        value={billingAddress.phone}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing-email">Email Address *</Label>
                    <Input
                      id="billing-email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={billingAddress.email}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing-addressLine1">Address Line 1 *</Label>
                    <Input
                      id="billing-addressLine1"
                      placeholder="123 Fashion Street"
                      value={billingAddress.addressLine1}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, addressLine1: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing-addressLine2">Address Line 2</Label>
                    <Input
                      id="billing-addressLine2"
                      placeholder="Apt 4B (Optional)"
                      value={billingAddress.addressLine2}
                      onChange={(e) =>
                        setBillingAddress({ ...billingAddress, addressLine2: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billing-city">City *</Label>
                      <Input
                        id="billing-city"
                        placeholder="New York"
                        value={billingAddress.city}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, city: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-state">State *</Label>
                      <Input
                        id="billing-state"
                        placeholder="NY"
                        value={billingAddress.state}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, state: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billing-zipCode">ZIP Code *</Label>
                      <Input
                        id="billing-zipCode"
                        placeholder="10001"
                        value={billingAddress.zipCode}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, zipCode: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-country">Country *</Label>
                      <Input
                        id="billing-country"
                        placeholder="United States"
                        value={billingAddress.country}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, country: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Payment Method</h2>
                  <p className="text-muted-foreground">
                    Select a saved card or add a new one
                  </p>
                </div>
                <Link to="/payment-methods">
                  <Button variant="link" className="text-purple-600 hover:text-purple-700">
                    Manage Cards
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {savedPaymentMethods.map((payment) => (
                  <div
                    key={payment.id}
                    onClick={() => setSelectedPaymentId(payment.id)}
                    className={cn(
                      "bg-card border-2 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md",
                      selectedPaymentId === payment.id
                        ? "border-foreground"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5",
                            selectedPaymentId === payment.id
                              ? "border-foreground bg-foreground"
                              : "border-border"
                          )}
                        >
                          {selectedPaymentId === payment.id && (
                            <Check className="w-4 h-4 text-background" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{payment.cardNumber}</p>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium uppercase",
                              payment.cardType === "visa" && "bg-blue-500/10 text-blue-700",
                              payment.cardType === "mastercard" && "bg-orange-500/10 text-orange-700",
                              payment.cardType === "amex" && "bg-green-500/10 text-green-700",
                              payment.cardType === "discover" && "bg-purple-500/10 text-purple-700"
                            )}>
                              {payment.cardType === "visa" && "💳 Visa"}
                              {payment.cardType === "mastercard" && "💳 Mastercard"}
                              {payment.cardType === "amex" && "💳 Amex"}
                              {payment.cardType === "discover" && "💳 Discover"}
                            </span>
                            {payment.isDefault && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 text-xs font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {payment.cardholderName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {payment.expiryMonth}/{payment.expiryYear}
                          </p>
                        </div>
                      </div>
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}

                {/* Add New Card Button */}
                <Link to="/payment-methods">
                  <button className="w-full border-2 border-dashed border-border rounded-2xl p-6 hover:border-foreground hover:bg-secondary/50 transition-all">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Add New Card</span>
                    </div>
                  </button>
                </Link>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              <Link to="/cart" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Cart
                </Button>
              </Link>
              <Button
                onClick={handleContinueToPayment}
                className="flex-1 sm:flex-auto gap-2"
              >
                Place Order
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 lg:mt-20">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <h2 className="text-xl font-bold">Order Summary</h2>

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

                {/* Trust Badges */}
                <div className="pt-4 space-y-2 text-xs text-muted-foreground text-center border-t border-border">
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
