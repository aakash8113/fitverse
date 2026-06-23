import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, X, Sparkles, Heart, Package, Settings, LogOut, MapPin, LogIn, LayoutDashboard, RotateCcw, Moon, Sun, Coins, AlertCircle } from "lucide-react";
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
import { useTheme } from "@/contexts/ThemeContext";
import { FitverseCoinIcon } from "@/components/shared/FitverseCoinIcon";
import logoImage from "@/assets/logo_black.png";
import logoWhite from "@/assets/logo_white.png";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/fitverse-ai", label: "FitVerse AI", isAI: true },
  { href: "/thrift", label: "Thrift" },
];

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

  // Determine active nav
  const isActive = (href: string) => {
    if (href === "/shop") return location.pathname.startsWith("/shop") || location.pathname.startsWith("/search") || location.pathname.startsWith("/product");
    if (href === "/thrift") return location.pathname.startsWith("/thrift");
    if (href === "/fitverse-ai") return location.pathname.startsWith("/fitverse-ai");
    return location.pathname === href;
  };

  // ── Shared dropdown content for both mobile and desktop ──
  const AccountDropdownContent = ({ isMobile }: { isMobile?: boolean }) => (
    <>
      {isAuthenticated && user && (
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className={isMobile ? "text-sm" : ""}>{user?.name}</span>
            <span className="text-xs text-muted-foreground font-normal">
              {user?.email}
            </span>
            {(user?.coinBalance ?? 0) >= 0 && (
              <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium mt-1">
                <FitverseCoinIcon className="h-3 w-3" />
                {user?.coinBalance ?? 0} Fitverse Coins
              </span>
            )}
          </div>
        </DropdownMenuLabel>
      )}
      {isAuthenticated && <DropdownMenuSeparator />}
      {user?.role === 'ADMIN' ? (
        <DropdownMenuItem asChild>
          <Link to="/admin/dashboard" className="flex items-center cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Admin Dashboard</span>
          </Link>
        </DropdownMenuItem>
      ) : isAuthenticated ? (
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
              <Coins className="mr-2 h-4 w-4" />
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
            <Link to="/settings" className="flex items-center cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </>
      ) : (
        <>
          <DropdownMenuItem asChild>
            <Link to="/login" className="flex items-center cursor-pointer">
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/signup" className="flex items-center cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Create Account</span>
            </Link>
          </DropdownMenuItem>
        </>
      )}
      {isAuthenticated && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </>
      )}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full glass border-b border-border/50">
      <div className="section-container">
        {/* ── Top bar: Logo + icons ── */}
        <nav className="flex h-14 sm:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img 
              src={theme === "dark" ? logoWhite : logoImage}
              alt="Fitverse Logo" 
              className="h-7 w-7 sm:h-9 sm:w-9 object-contain"
            />
            <span
              className="text-lg sm:text-2xl font-bold tracking-wider leading-none"
              style={{ fontFamily: 'Mokoto, sans-serif' }}
            >
              FITVERSE
            </span>
          </Link>

          {/* Desktop Nav links */}
          <div className="hidden lg:flex items-center gap-12 xl:gap-20">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "nav-link text-sm font-medium transition-colors whitespace-nowrap",
                  isActive(link.href) && "nav-link-active",
                  link.isAI && "gradient-ai-text font-semibold"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search bar (desktop inline) */}
          <form
            onSubmit={handleSearch}
            className={cn(
              "hidden lg:flex items-center gap-2 transition-all duration-300 overflow-hidden",
              isSearchOpen ? "flex-1 mx-8 opacity-100" : "w-0 opacity-0 pointer-events-none mx-0"
            )}
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                className="pl-9 pr-4 h-9 w-full rounded-full border-2 border-black dark:border-white bg-muted/50 focus:bg-background text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
              />
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search icon — desktop only */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex hover:bg-secondary hover:text-foreground"
              onClick={isSearchOpen ? closeSearch : openSearch}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {/* Mobile search icon */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-secondary hover:text-foreground"
              onClick={openSearch}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme toggle — visible on all screen sizes */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-secondary hover:text-foreground"
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-secondary hover:text-foreground">
                <ShoppingBag className="h-5 w-5" />
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black text-[10px] font-medium text-white flex items-center justify-center dark:bg-white dark:text-black">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Button>
            </Link>
            
            {/* Account dropdown — same for mobile + desktop but different triggers */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-secondary hover:text-foreground">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <AccountDropdownContent />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* ── Mobile: Nav tabs below logo ── */}
        <div className="lg:hidden flex items-center border-t border-border/40">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors border-b-2",
                isActive(link.href)
                  ? "border-black dark:border-white text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {link.isAI}
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Mobile search bar (expands below tabs) ── */}
        {isSearchOpen && (
          <div className="lg:hidden pb-2 animate-fade-in">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-9 pr-4 h-9 w-full rounded-full border-2 border-black dark:border-white bg-muted/50 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeSearch}>
                <X className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {isAuthenticated && user && !user.isEmailVerified && (
          <div className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Email not verified.</span>
              </div>
              <Link
                to="/settings?verify=email"
                className="font-semibold underline underline-offset-2 shrink-0"
              >
                Verify now
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}