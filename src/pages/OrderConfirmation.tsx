import { Link } from "react-router-dom";
import { CheckCircle, Package, MapPin, CreditCard, Calendar, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function OrderConfirmation() {
  // Mock order data - in production, this would come from the order context/API
  const orderNumber = "FV" + Math.random().toString(36).substr(2, 9).toUpperCase();
  const orderDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  const orderItems = [
    {
      id: "1",
      name: "Premium Performance Tank",
      size: "M",
      color: "Black",
      quantity: 2,
      price: 59.99,
      image: "https://images.unsplash.com/photo-1623470909149-0e45a6c3d0d1?w=400",
    },
    {
      id: "2",
      name: "Athletic Joggers",
      size: "L",
      color: "Navy",
      quantity: 1,
      price: 79.99,
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400",
    },
    {
      id: "3",
      name: "Sport Compression Shorts",
      size: "M",
      color: "Gray",
      quantity: 1,
      price: 49.99,
      image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400",
    },
  ];

  const shippingAddress = {
    name: "John Doe",
    addressLine1: "123 Fashion Street",
    addressLine2: "Apt 4B",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "United States",
  };

  const paymentMethod = {
    cardNumber: "**** **** **** 4242",
    cardType: "Visa",
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 15.0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-12 md:py-16">
        {/* Success Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-lg text-muted-foreground mb-2">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
          <p className="text-muted-foreground">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-bold">#{orderNumber}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                    <p className="font-bold">{estimatedDelivery}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6">Order Items</h2>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        Size: {item.size} | Color: {item.color}
                      </p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

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
            </div>

            {/* Shipping Address */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Shipping Address</h3>
              </div>
              <div className="text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">{shippingAddress.name}</p>
                <p>{shippingAddress.addressLine1}</p>
                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                </p>
                <p>{shippingAddress.country}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Payment Method</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {paymentMethod.cardType} {paymentMethod.cardNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-lg mb-4">What's Next?</h3>

                <Link to={`/track-order?order=${orderNumber}`} className="block">
                  <Button className="w-full gap-2 justify-between">
                    Track Your Order
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <Link to="/orders" className="block">
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
                </Link>

                <Link to="/shop" className="block">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>

                <Separator className="my-4" />

                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <span>
                      You'll receive shipping updates via email and SMS (if enabled)
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <span>Your order will be delivered by {estimatedDelivery}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <span>Free returns within 30 days of delivery</span>
                  </p>
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-secondary/30 border border-border rounded-2xl p-6">
                <h4 className="font-semibold mb-2">Need Help?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Our customer support team is here to assist you.
                </p>
                <Link to="/contact">
                  <Button variant="link" className="p-0 h-auto text-purple-600 hover:text-purple-700">
                    Contact Support →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Order Date */}
        <div className="max-w-5xl mx-auto mt-8 text-center text-sm text-muted-foreground">
          Order placed on {orderDate}
        </div>
      </div>

      <Footer />
    </div>
  );
}
