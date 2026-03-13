import { Truck } from "lucide-react";
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
                <li>We currently ship to addresses in the Vadodara and select destinations</li>
                <li>PO Box addresses are accepted for standard shipping only</li>
                <li>We cannot ship to military APO/FPO addresses at this time</li>
                <li>Some remote locations may require additional delivery time</li>
              </ul>
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
