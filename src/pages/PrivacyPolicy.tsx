import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield, Eye, Lock, Database, Globe, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Introduction</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  At Fitverse, accessible from fitverse.com, one of our main priorities is
                  the privacy of our visitors. This Privacy Policy document contains types
                  of information that is collected and recorded by Fitverse and how we use
                  it.
                </p>
                <p>
                  If you have additional questions or require more information about our
                  Privacy Policy, do not hesitate to contact us at privacy@fitverse.com.
                </p>
              </div>
            </div>

            {/* Information We Collect */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Information We Collect</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The personal information that you are asked to provide, and the reasons
                  why you are asked to provide it, will be made clear to you at the point
                  we ask you to provide your personal information.
                </p>
                <p>When you register for an account, we may collect:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Name and contact information (email, phone number)</li>
                  <li>Billing and shipping addresses</li>
                  <li>Payment information (processed securely through our payment partners)</li>
                  <li>Order history and preferences</li>
                  <li>Device and browser information</li>
                  <li>IP address and location data</li>
                </ul>
                <p>
                  If you contact us directly, we may receive additional information about
                  you such as the contents of the message and/or attachments you may send
                  us, and any other information you may choose to provide.
                </p>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>We use the information we collect in various ways, including to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide, operate, and maintain our website</li>
                  <li>Improve, personalize, and expand our website</li>
                  <li>Process your transactions and send you related information</li>
                  <li>Send you order confirmations and shipping updates</li>
                  <li>Communicate with you about your account and customer service</li>
                  <li>Send you promotional emails and special offers (with your consent)</li>
                  <li>Find and prevent fraud</li>
                  <li>Analyze usage and trends to improve user experience</li>
                </ul>
              </div>
            </div>

            {/* Data Security */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Lock className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Data Security</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We value your trust in providing us your Personal Information, thus we
                  are striving to use commercially acceptable means of protecting it. We use
                  SSL/TLS encryption for data transmission and store your information on
                  secure servers.
                </p>
                <p>
                  However, remember that no method of transmission over the internet, or
                  method of electronic storage is 100% secure and reliable, and we cannot
                  guarantee its absolute security.
                </p>
                <p>
                  We implement appropriate technical and organizational measures to maintain
                  the security of your personal data, including protection against
                  unauthorized or unlawful processing and against accidental loss,
                  destruction or damage.
                </p>
              </div>
            </div>

            {/* Your Rights */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Your Data Rights</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>Under applicable data protection laws, you have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Access:</strong> Request copies of your personal data
                  </li>
                  <li>
                    <strong>Rectification:</strong> Request correction of inaccurate data
                  </li>
                  <li>
                    <strong>Erasure:</strong> Request deletion of your personal data
                  </li>
                  <li>
                    <strong>Restriction:</strong> Request restriction of processing
                  </li>
                  <li>
                    <strong>Portability:</strong> Request transfer of your data
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to processing of your data
                  </li>
                </ul>
                <p>
                  To exercise any of these rights, please contact us at
                  privacy@fitverse.com. We will respond to your request within 30 days.
                </p>
              </div>
            </div>

            {/* Cookies */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Globe className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Cookies & Tracking</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Like any other website, Fitverse uses "cookies". These cookies are used
                  to store information including visitors' preferences, and the pages on the
                  website that the visitor accessed or visited.
                </p>
                <p>
                  You can choose to disable cookies through your individual browser options.
                  For more detailed information about cookie management with specific web
                  browsers, please refer to your browser's documentation.
                </p>
                <p>We use cookies for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Remembering your preferences and settings</li>
                  <li>Understanding how you use our website</li>
                  <li>Keeping your shopping cart items</li>
                  <li>Maintaining your login session</li>
                  <li>Personalizing content and advertisements</li>
                </ul>
              </div>
            </div>

            {/* Third-Party Services */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may employ third-party companies and individuals to facilitate our
                  Service, provide Service on our behalf, perform Service-related services,
                  or assist us in analyzing how our Service is used.
                </p>
                <p>
                  These third parties have access to your Personal Information only to
                  perform these tasks on our behalf and are obligated not to disclose or use
                  it for any other purpose. This includes payment processors, shipping
                  carriers, email service providers, and analytics services.
                </p>
              </div>
            </div>

            {/* Children's Privacy */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Our Service does not address anyone under the age of 13. We do not
                  knowingly collect personally identifiable information from children under
                  13. If you are a parent or guardian and you are aware that your child has
                  provided us with Personal Information, please contact us.
                </p>
              </div>
            </div>

            {/* Changes to Policy */}
            <div className="glass rounded-2xl border border-border/50 p-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of
                  any changes by posting the new Privacy Policy on this page and updating
                  the "Last updated" date.
                </p>
                <p>
                  You are advised to review this Privacy Policy periodically for any
                  changes. Changes to this Privacy Policy are effective when they are posted
                  on this page.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="glass rounded-2xl border border-border/50 p-8 bg-gradient-to-br from-accent/10 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Contact Us</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  <a
                    href="mailto:privacy@fitverse.com"
                    className="text-accent hover:text-accent/80"
                  >
                    privacy@fitverse.com
                  </a>
                </p>
                <p>
                  <span className="font-semibold">Address:</span> 123 Fashion Street, New
                  York, NY 10001
                </p>
                <p>
                  <span className="font-semibold">Phone:</span> +1 (555) 123-4567
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
