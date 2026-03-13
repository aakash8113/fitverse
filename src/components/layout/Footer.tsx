import { Link } from "react-router-dom";
import { Sparkles, Instagram, Twitter, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import logoBlack from "@/assets/logo_black.png";
import logoWhite from "@/assets/logo_white.png";

export function Footer() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({
        title: "Email is required",
        description: "Please enter your email before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "You're all set",
      description: "We'll keep you posted on new arrivals and exclusive offers.",
    });
    setEmail("");
  };

  return (
    <footer className="bg-[#0a0a0a] text-white">
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
              src={theme === "dark" ? logoWhite : logoBlack} 
              alt="Fitverse Logo" 
              className=" h-10 w-10 object-contain translate-y-[-5px]"
            />
            <span
              className="text-[26px] font-bold tracking-wider leading-none"
              style={{ fontFamily: 'Mokoto, sans-serif' }}
            >
              FITVERSE
            </span>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              Revolutionizing fashion with AI-powered virtual try-ons. See how clothes fit before you buy.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="hover:bg-white/10" asChild>
                <a href="https://www.instagram.com/fitverse.fof" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10" asChild>
                <a href="https://www.instagram.com/fitverse.fof" target="_blank" rel="noopener noreferrer" aria-label="Fitverse Instagram">
                  <Twitter className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10" asChild>
                <a href="https://www.instagram.com/fitverse.fof" target="_blank" rel="noopener noreferrer" aria-label="Fitverse Instagram">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h4 className="font-semibold">Shop</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/shop?gender=WOMENS" className="hover:text-white transition-colors">Women</Link></li>
              <li><Link to="/shop?gender=MENS" className="hover:text-white transition-colors">Men</Link></li>
              {/* <li><Link to="/collections" className="hover:text-white transition-colors">Collections</Link></li> */}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="font-semibold">Customer Service</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/track-order" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link to="/return-policy" className="hover:text-white transition-colors">Returns</Link></li>
              <li><Link to="/size-guide" className="hover:text-white transition-colors">Size Guide</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold">Stay Updated</h4>
            <p className="text-sm text-white/70">
              Get the latest on new arrivals and exclusive offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 placeholder:text-white/50"
              />
              <Button type="submit" variant="secondary" className="px-4">
                <Mail className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/50">
          
          </p>
          <div className="flex gap-6 text-sm text-white/50">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/return-policy" className="hover:text-white transition-colors">Returns</Link>
            <Link to="/shipping" className="hover:text-white transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
