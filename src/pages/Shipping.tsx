import { Truck, Package, Globe, Clock, DollarSign, MapPin } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Shipping() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">Shipping & Delivery</h1>
          <p className="text-lg text-muted-foreground">
            Fast, reliable shipping options to get your fashion finds to you quickly
          </p>
        </div>

        {/* Shipping Options */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl font-bold mb-6">Shipping Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Shipping */}
            <div className="glass rounded-2xl border border-border/50 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Standard Shipping</h3>
                  <p className="text-muted-foreground mb-4">
                    5-7 business days delivery
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>$5.99 or FREE on orders over $75</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Order by 2 PM EST for same-day processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Express Shipping */}
            <div className="glass rounded-2xl border border-accent/20 p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Truck className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Express Shipping</h3>
                  <p className="text-muted-foreground mb-4">
                    2-3 business days delivery
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>$12.99 flat rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Order by 12 PM EST for same-day processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Day */}
            <div className="glass rounded-2xl border border-border/50 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Next Day Delivery</h3>
                  <p className="text-muted-foreground mb-4">
                    1 business day delivery
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>$24.99 flat rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Order by 10 AM EST for next-day delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* International */}
            <div className="glass rounded-2xl border border-border/50 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">International</h3>
                  <p className="text-muted-foreground mb-4">
                    7-14 business days delivery
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Varies by destination</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Available to 100+ countries</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Policy */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl font-bold mb-6">Shipping Policy</h2>
          <div className="glass rounded-2xl border border-border/50 p-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Processing Time</h3>
              <p className="text-muted-foreground">
                Orders are processed within 1-2 business days (Monday-Friday, excluding holidays). 
                You'll receive a confirmation email with tracking information once your order ships.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Tracking Your Order</h3>
              <p className="text-muted-foreground mb-3">
                Once shipped, you can track your package using the tracking number provided in your 
                shipping confirmation email. You can also track orders from{" "}
                <Link to="/track-order" className="text-accent hover:underline">
                  our tracking page
                </Link>{" "}
                or your{" "}
                <Link to="/orders" className="text-accent hover:underline">
                  order history
                </Link>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Shipping Restrictions</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>We currently ship to addresses in the United States and select international destinations</li>
                <li>PO Box addresses are accepted for standard shipping only</li>
                <li>We cannot ship to military APO/FPO addresses at this time</li>
                <li>Some remote locations may require additional delivery time</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">International Orders</h3>
              <p className="text-muted-foreground">
                International customers are responsible for any customs, duties, or taxes imposed by 
                their country. Shipping times do not include customs processing. For questions about 
                international shipping, please{" "}
                <Link to="/contact" className="text-accent hover:underline">
                  contact our support team
                </Link>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Lost or Damaged Packages</h3>
              <p className="text-muted-foreground">
                If your package is lost or arrives damaged, please contact us within 48 hours of 
                delivery (or expected delivery date). We'll work with you to resolve the issue 
                quickly, whether that means filing a claim with the carrier or sending a replacement.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="glass rounded-xl border border-border/50 p-6">
              <h3 className="font-semibold mb-2">Can I change my shipping address after placing an order?</h3>
              <p className="text-muted-foreground text-sm">
                If your order hasn't shipped yet, we can update the shipping address. Please contact 
                us immediately with your order number and new address.
              </p>
            </div>

            <div className="glass rounded-xl border border-border/50 p-6">
              <h3 className="font-semibold mb-2">Do you offer same-day delivery?</h3>
              <p className="text-muted-foreground text-sm">
                Same-day delivery is currently available in select metropolitan areas. Check your 
                zip code at checkout to see if you qualify.
              </p>
            </div>

            <div className="glass rounded-xl border border-border/50 p-6">
              <h3 className="font-semibold mb-2">What if I need my order by a specific date?</h3>
              <p className="text-muted-foreground text-sm">
                We recommend selecting Express or Next Day shipping for time-sensitive orders. While 
                we make every effort to meet delivery estimates, we cannot guarantee delivery by a 
                specific date due to carrier variables.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Still have questions?</h3>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/contact">
              <Button size="lg">Contact Support</Button>
            </Link>
            <Link to="/track-order">
              <Button variant="outline" size="lg">Track Your Order</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
