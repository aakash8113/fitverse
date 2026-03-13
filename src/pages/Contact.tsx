import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll
              respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="glass rounded-2xl border border-border/50 p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Email Us</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Our team is here to help
              </p>
              <a
                href="mailto:fitverse901@gmail.com"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                fitverse901@gmail.com
              </a>
            </div>

            <div className="glass rounded-2xl border border-border/50 p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Call Us</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Mon-Fri 9am-6pm IST
              </p>
              <a
                href="tel:+919724392829"
                className="text-accent hover:text-accent/80 transition-colors"
              >
                +91 97243 92829
              </a>
            </div>

            <div className="glass rounded-2xl border border-border/50 p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Visit Us</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Come say hello at our office
              </p>
              <p className="text-sm">
                A101 Bholebhavan
                <br />
                Vadodara ,390001
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold">Send us a Message</h2>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input id="phone" type="tel" placeholder="+91 97243 92829" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">Order Inquiry</SelectItem>
                      <SelectItem value="product">Product Question</SelectItem>
                      <SelectItem value="shipping">Shipping & Delivery</SelectItem>
                      <SelectItem value="return">Returns & Exchanges</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Send Message
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-2xl border border-border/50 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="text-xl font-semibold">Business Hours</h2>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 6:00 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="font-medium">10:00 AM - 4:00 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl border border-border/50 p-8">
                <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
                <div className="space-y-3">
                  <a
                    href="/faq"
                    className="block text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    → Frequently Asked Questions
                  </a>
                  <a
                    href="/track-order"
                    className="block text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    → Track Your Order
                  </a>
                  <a
                    href="/shipping"
                    className="block text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    → Shipping Information
                  </a>
                  <a
                    href="/return-policy"
                    className="block text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    → Returns & Exchanges
                  </a>
                  <a
                    href="/size-guide"
                    className="block text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    → Size Guide
                  </a>
                </div>
              </div>

              <div className="glass rounded-2xl border border-border/50 p-8 bg-gradient-to-br from-accent/10 to-transparent">
                <h3 className="font-semibold mb-2">Need Immediate Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Check out our FAQ section for quick answers to common questions
                </p>
                <a href="/faq">
                  <Button variant="outline" className="w-full">
                    Visit FAQ
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
