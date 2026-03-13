import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FileText, Shield, ShoppingCart, CreditCard, AlertCircle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">1. Introduction</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Welcome to Fitverse ("Company," "we," "our," "us")! These Terms of
                  Service ("Terms," "Terms of Service") govern your use of our website
                  located at fitverse.com (together or individually "Service") operated
                  by Fitverse.
                </p>
                <p>
                  Our Privacy Policy also governs your use of our Service and explains how
                  we collect, safeguard and disclose information that results from your use
                  of our web pages.
                </p>
                <p>
                  Your agreement with us includes these Terms and our Privacy Policy
                  ("Agreements"). You acknowledge that you have read and understood
                  Agreements, and agree to be bound by them.
                </p>
                <p>
                  If you do not agree with (or cannot comply with) Agreements, then you may
                  not use the Service, but please let us know by emailing at
                  fitverse901@gmail.com so we can try to find a solution.
                </p>
              </div>
            </div>

            {/* Account */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">2. Accounts</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  When you create an account with us, you guarantee that the information you provide us is accurate, complete,
                  and current at all times. Inaccurate, incomplete, or obsolete information
                  may result in the immediate termination of your account on Service.
                </p>
                <p>
                  You are responsible for maintaining the confidentiality of your account
                  and password, including but not limited to the restriction of access to
                  your computer and/or account. You agree to accept responsibility for any
                  and all activities or actions that occur under your account and/or
                  password, whether your password is with our Service or a third-party
                  service.
                </p>
                <p>
                  You must notify us immediately upon becoming aware of any breach of
                  security or unauthorized use of your account. You may not use as a
                  username the name of another person or entity or that is not lawfully
                  available for use.
                </p>
              </div>
            </div>

            {/* Purchases */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">3. Products & Purchases</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We reserve the right to refuse any order you place with us. We may, in
                  our sole discretion, limit or cancel quantities purchased per person, per
                  household or per order. These restrictions may include orders placed by
                  or under the same customer account, the same credit card, and/or orders
                  that use the same billing and/or shipping address.
                </p>
                <p>
                  In the event that we make a change to or cancel an order, we may attempt
                  to notify you by contacting the email and/or billing address/phone number
                  provided at the time the order was made.
                </p>
                <p>
                  We reserve the right to limit or prohibit orders that, in our sole
                  judgment, appear to be placed by dealers, resellers or distributors.
                </p>
                <p>
                  All descriptions of products or product pricing are subject to change at
                  anytime without notice, at our sole discretion. We reserve the right to
                  discontinue any product at any time.
                </p>
              </div>
            </div>

            {/* Payment */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">4. Payment Terms</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We accept various payment methods including credit cards, debit cards,
                  and other digital payment methods. By submitting your payment
                  information, you authorize us to charge the applicable fees to your
                  selected payment method.
                </p>
                <p>
                  All prices are listed in Indian Rupees (INR) unless otherwise specified. Prices
                  are subject to change without notice. You agree to pay all fees and
                  applicable taxes incurred by you or anyone using your account.
                </p>
                <p>
                  In the event of payment processing errors, we reserve the right to
                  correct such errors and will notify you of the correction. If payment is
                  not received within 7 days of the invoice date, we reserve the right to
                  suspend or terminate your access to the Service.
                </p>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">5. Intellectual Property</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Service and its original content (excluding Content provided by users),
                  features and functionality are and will remain the exclusive property of
                  Fitverse and its licensors. Service is protected by copyright, trademark,
                  and other laws of foreign countries.
                </p>
                <p>
                  Our trademarks may not be used in connection with any product or service
                  without the prior written consent of Fitverse.
                </p>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">6. Limitation of Liability</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Except as prohibited by law, you will hold us and our officers,
                  directors, employees, and agents harmless for any indirect, punitive,
                  special, incidental, or consequential damage, however it arises
                  (including attorneys' fees and all related costs and expenses of
                  litigation and arbitration).
                </p>
                <p>
                  In no event shall Fitverse, nor its directors, employees, partners,
                  agents, suppliers, or affiliates, be liable for any indirect, incidental,
                  special, consequential or punitive damages, including without limitation,
                  loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </div>
            </div>

            {/* Changes */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these
                  Terms at any time. If a revision is material we will provide at least 30
                  days notice prior to any new terms taking effect. What constitutes a
                  material change will be determined at our sole discretion.
                </p>
                <p>
                  By continuing to access or use our Service after any revisions become
                  effective, you agree to be bound by the revised terms. If you do not
                  agree to the new terms, you are no longer authorized to use Service.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="glass rounded-2xl border border-border/50 p-8 bg-gradient-to-br from-accent/10 to-transparent">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  <a
                    href="mailto:legal@fitverse.com"
                    className="text-accent hover:text-accent/80"
                  >
                    legal@fitverse.com
                  </a>
                </p>
                <p>
                  <span className="font-semibold">Address:</span> A101, Bholebhavan, Vadodara, 390001
                </p>
                <p>
                  <span className="font-semibold">Phone:</span> +91 9724392829
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
