import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Menu, X, Sparkles, Heart, Package, Settings, LogOut, MapPin, CreditCard, LogIn, LayoutDashboard, RotateCcw, CircleDollarSign } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cartApi } from "@/services/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@/assets/logo.jpg";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/fitverse-ai", label: "FitVerse AI", isAI: true },
  { href: "/thrift", label: "Thrift" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Auto-focus when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.getCart,
    enabled: isAuthenticated,
  });

  const cartCount = cartData?.data?.items?.reduce(
    (sum: number, item: { quantity: number }) => sum + item.quantity,
    0
  ) ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      closeSearch();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/50">
      <div className="section-container">
        <nav className="flex h-16 items-center justify-between lg:h-20">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Fitverse Logo" 
              className=" h-10 w-10 object-contain translate-y-[-5px] sm:translate-y-0 sm:translate-x-[-120px]"
            />
            <span
              className="text-[26px] font-bold tracking-wider leading-none sm:translate-y-[4.5px] sm:translate-x-[-120px]"
              style={{ fontFamily: 'Mokoto, sans-serif' }}
            >
              FITVERSE
            </span>
          </Link>

          {/* Nav links — hidden when search is open */}
          <div className={cn(
            "hidden lg:flex items-center gap-8 transition-all duration-200",
            isSearchOpen && "!hidden"
          )}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "nav-link text-sm font-medium transition-colors",
                  location.pathname === link.href && "nav-link-active",
                  link.isAI && "gradient-ai-text font-semibold"
                )}
              >
                {link.isAI}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Inline expanding search bar */}
          <form
            onSubmit={handleSearch}
            className={cn(
              "hidden lg:flex items-center gap-2 transition-all duration-300 overflow-hidden",
              isSearchOpen ? "flex-1 mx-8 opacity-100" : "w-0 opacity-0 pointer-events-none mx-0"
            )}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                className="pl-9 pr-4 h-9 w-full rounded-full border-border/60 bg-muted/50 focus:bg-background text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            {/* Search icon toggles; becomes X when open */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex hover:bg-gray-100 hover:text-foreground"
              onClick={isSearchOpen ? closeSearch : openSearch}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
            
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 hover:text-foreground">
                <ShoppingBag className="h-5 w-5" />
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black text-[10px] font-medium text-white flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Button>
            </Link>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-gray-100 hover:text-foreground">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.name}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {user?.email}
                      </span>
                      {(user?.coinBalance ?? 0) >= 0 && (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium mt-1">
                          <CircleDollarSign className="h-3 w-3" />
                          {user?.coinBalance ?? 0} Fitverse Coins
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.role === 'ADMIN' ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard" className="flex items-center cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/account" className="flex items-center cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Account</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/wishlist" className="flex items-center cursor-pointer">
                          <Heart className="mr-2 h-4 w-4" />
                          <span>Wishlist</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="flex items-center cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          <span>Orders</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/returns" className="flex items-center cursor-pointer">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          <span>My Returns</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/coins" className="flex items-center cursor-pointer">
                          <CircleDollarSign className="mr-2 h-4 w-4 text-yellow-600" />
                          <span>Fitverse Coins</span>
                          {(user?.coinBalance ?? 0) > 0 && (
                            <span className="ml-auto text-xs font-semibold text-yellow-600">{user?.coinBalance}</span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/addresses" className="flex items-center cursor-pointer">
                          <MapPin className="mr-2 h-4 w-4" />
                          <span>Addresses</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/payment-methods" className="flex items-center cursor-pointer">
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>Payment Methods</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="flex items-center cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-gray-100 hover:text-foreground">
                  <LogIn className="h-5 w-5" />
                </Button>
              </Link>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>

        {isMenuOpen && (
          <div className="lg:hidden border-t border-border/50 py-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "text-base font-medium py-2 transition-colors",
                    location.pathname === link.href 
                      ? "text-foreground" 
                      : "text-muted-foreground hover:text-foreground",
                    link.isAI && "gradient-ai-text font-semibold"
                  )}
                >
                  {link.isAI && <Sparkles className="inline-block h-4 w-4 mr-1.5" />}
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-4 pt-4 border-t border-border/50">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setIsMenuOpen(false);
                    openSearch();
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Link to="/wishlist" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    Wishlist
                  </Button>
                </Link>
                {isAuthenticated ? (
                  <Link to="/account" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </header>
  );
}
