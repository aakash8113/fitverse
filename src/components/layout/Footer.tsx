import { Link } from "react-router-dom";
import { Sparkles, Instagram, Twitter, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="gradient-ai rounded-lg p-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Fitverse</span>
            </Link>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Revolutionizing fashion with AI-powered virtual try-ons. See how clothes fit before you buy.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10" asChild>
                <a href="https://www.instagram.com/fitverse.fof" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10">
                <Facebook className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h4 className="font-semibold">Shop</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link to="/shop?category=WOMEN" className="hover:text-primary-foreground transition-colors">Women</Link></li>
              <li><Link to="/shop?category=MEN" className="hover:text-primary-foreground transition-colors">Men</Link></li>
              <li><Link to="/shop?category=UNISEX" className="hover:text-primary-foreground transition-colors">Unisex</Link></li>
              <li><Link to="/collections" className="hover:text-primary-foreground transition-colors">Collections</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-foreground transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-primary-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="font-semibold">Customer Service</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link to="/track-order" className="hover:text-primary-foreground transition-colors">Track Order</Link></li>
              <li><Link to="/shipping" className="hover:text-primary-foreground transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="hover:text-primary-foreground transition-colors">Returns</Link></li>
              <li><Link to="/size-guide" className="hover:text-primary-foreground transition-colors">Size Guide</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold">Stay Updated</h4>
            <p className="text-sm text-primary-foreground/70">
              Get the latest on new arrivals and exclusive offers.
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-primary-foreground/10 border-primary-foreground/20 placeholder:text-primary-foreground/50"
              />
              <Button variant="secondary" size="icon">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/50">
            © 2025 Fitverse. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-primary-foreground/50">
            <Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms</Link>
            <Link to="/returns" className="hover:text-primary-foreground transition-colors">Returns</Link>
            <Link to="/shipping" className="hover:text-primary-foreground transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
