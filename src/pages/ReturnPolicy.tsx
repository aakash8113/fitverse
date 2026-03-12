import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RotateCcw, Package, Truck, CreditCard, Clock, AlertCircle } from "lucide-react";

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">
              Returns & Exchange Policy
            </h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <div className="space-y-8">
            {/* Overview */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Our Return Promise</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  At Fitverse, we want you to be completely satisfied with your purchase.
                  If you're not happy with your order, we offer a hassle-free 7-day return
                  policy. Returns are free for most items within the United States.
                </p>
                <p>
                  We stand behind the quality of our products and are committed to making
                  the return process as smooth as possible.
                </p>
              </div>
            </div>

            {/* Return Window */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Return Window</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You have <strong>7 days</strong> from the date you receive your order to
                  initiate a return. Items must be returned in their original condition with
                  all tags attached.
                </p>
                <p>
                  For items purchased during holiday season (November 1 - December 31), we
                  extend our return window to January 31 of the following year.
                </p>
              </div>
            </div>

            {/* Eligible Items */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Return Eligibility</h2>
              </div>
              <div className="space-y-6 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">✓ Items We Accept:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Unworn, unwashed clothing with original tags attached</li>
                    <li>Shoes in original box with no signs of wear</li>
                    <li>Accessories in original packaging</li>
                    <li>Items in resaleable condition</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">✗ Items We Cannot Accept:</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Underwear, swimwear, and intimate apparel (for hygiene reasons)</li>
                    <li>Items marked as "Final Sale"</li>
                    <li>Worn, washed, or damaged items</li>
                    <li>Items without original tags or packaging</li>
                    <li>Gift cards</li>
                    <li>Customized or personalized items</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How to Return */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Truck className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">How to Return an Item</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 text-accent font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Log into Your Account</p>
                      <p className="text-sm">
                        Navigate to "Order History" and select the order you wish to return
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 text-accent font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Select Items to Return</p>
                      <p className="text-sm">
                        Choose which items you want to return and provide a reason
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 text-accent font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Print Return Label</p>
                      <p className="text-sm">
                        Download and print your prepaid return shipping label
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 text-accent font-semibold">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Package Your Return</p>
                      <p className="text-sm">
                        Place items in original packaging if possible, attach the label
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 text-accent font-semibold">
                      5
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Ship Your Return</p>
                      <p className="text-sm">
                        Drop off at any USPS, FedEx, or UPS location
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Refunds */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Refunds</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Once we receive your return, we'll inspect the items and process your
                  refund within <strong>5-7 business days</strong>. You'll receive an email
                  confirmation when your refund has been processed.
                </p>
                <p>
                  Refunds will be issued to your original payment method. Please allow an
                  additional 3-5 business days for the refund to appear on your statement,
                  depending on your bank or credit card company.
                </p>
                <p>
                  <strong>Note:</strong> Original shipping costs are non-refundable unless
                  the return is due to our error (wrong item sent, defective product, etc.).
                </p>
              </div>
            </div>

            {/* Exchanges */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Exchanges</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We offer free exchanges for different sizes or colors of the same item.
                  Simply follow the return process and indicate that you'd like an exchange.
                </p>
                <p>
                  We'll ship your replacement item as soon as we receive your return. If
                  your preferred size or color is out of stock, we'll issue a full refund
                  instead.
                </p>
                <p>
                  <strong>Pro Tip:</strong> To ensure you get your desired item, we
                  recommend placing a new order for the item you want while initiating the
                  return for the original item.
                </p>
              </div>
            </div>

            {/* International Returns */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <h2 className="text-2xl font-semibold mb-4">International Returns</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  International returns are accepted within 7 days. However, customers are
                  responsible for return shipping costs. We recommend using a tracked
                  shipping method as we cannot guarantee receipt of untracked returns.
                </p>
                <p>
                  Original shipping costs and customs duties are non-refundable. Refunds
                  will be issued in INR to your original payment method.
                </p>
              </div>
            </div>

            {/* Damaged/Defective */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Damaged or Defective Items</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you receive a damaged or defective item, please contact us immediately
                  at support@fitverse.com with photos of the damage. We'll arrange for a
                  replacement or full refund, including return shipping costs.
                </p>
                <p>
                  We stand behind our products and will work quickly to resolve any issues
                  with damaged or defective merchandise.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="glass rounded-2xl border border-border/50 p-8 bg-gradient-to-br from-accent/10 to-transparent">
              <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about our return policy or need assistance with a
                return, our customer service team is here to help:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  <a
                    href="mailto:returns@fitverse.com"
                    className="text-accent hover:text-accent/80"
                  >
                    returns@fitverse.com
                  </a>
                </p>
                <p>
                  <span className="font-semibold">Phone:</span> +1 (555) 123-4567
                </p>
                <p>
                  <span className="font-semibold">Hours:</span> Monday-Friday, 9am-6pm EST
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
