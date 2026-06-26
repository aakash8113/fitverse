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

// ── Shared dropdown content (used on both desktop & mobile) ──
function AccountDropdownContent({ user, isAuthenticated, handleLogout }: {
  user: any;
  isAuthenticated: boolean;
  handleLogout: () => void;
}) {
  return (
    <>
      {isAuthenticated && user && (
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user?.name}</span>
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
}

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

  // Determine active nav (for mobile tabs)
  const isActive = (href: string) => {
    if (href === "/shop") return location.pathname.startsWith("/shop") || location.pathname.startsWith("/search") || location.pathname.startsWith("/product");
    if (href === "/thrift") return location.pathname.startsWith("/thrift");
    if (href === "/fitverse-ai") return location.pathname.startsWith("/fitverse-ai");
    return location.pathname === href;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full glass border-b border-border/50">
      <div className="section-container">
        <nav className="flex h-16 items-center justify-between lg:h-20">
          {/* ── Logo (desktop) ── */}
          <Link to="/" className="hidden sm:flex items-center gap-3">
            <img 
              src={theme === "dark" ? logoWhite : logoImage}
              alt="Fitverse Logo" 
              className="translate-y-[1px] h-8 w-8 sm:h-10 sm:w-10 object-contain sm:translate-y-[-1px] sm:translate-x-[-120px]"
            />
            <span
              className="translate-y-[4px] text-[20px] sm:text-[26px] font-bold tracking-wider leading-none sm:translate-y-[4.5px] sm:translate-x-[-120px]"
              style={{ fontFamily: 'Mokoto, sans-serif' }}
            >
              FITVERSE
            </span>
          </Link>

          {/* ── Logo (mobile-only, no translate offsets) ── */}
          <Link to="/" className="sm:hidden flex items-center gap-1 shrink-0">
            <img 
              src={theme === "dark" ? logoWhite : logoImage}
              alt="Fitverse Logo" 
              className="h-6 w-6 object-contain"
            />
            <span
              className="text-[16px] font-bold tracking-wider leading-none"
              style={{ fontFamily: 'Mokoto, sans-serif' }}
            >
              FITVERSE
            </span>
          </Link>

          {/* ── Desktop Nav links — hidden when search is open ── */}
          <div className={cn(
            "hidden lg:flex items-center gap-24 transition-all duration-200 sm:translate-x-[140px]",
            isSearchOpen && "!hidden"
          )}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "nav-link text-sm sm:text-base font-medium transition-colors",
                  location.pathname === link.href && "nav-link-active",
                  link.isAI && "gradient-ai-text font-semibold"
                )}
              >
                {link.isAI}
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Inline expanding search bar (desktop) — shown at all sizes when open ── */}
          <form
            onSubmit={handleSearch}
            className={cn(
              "hidden lg:flex items-center gap-2 transition-all duration-300 overflow-hidden",
              isSearchOpen ? "flex flex-1 mx-4 lg:mx-8 opacity-100" : "hidden opacity-0 pointer-events-none mx-0"
            )}
          >
            <div className="relative flex-1">
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

          {/* ── Right side icons (desktop) ── */}
          <div className="hidden sm:flex sm:translate-x-[120px] items-center gap-3 sm:gap-4">
            {/* Search icon toggles (desktop); becomes X when open */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-secondary hover:text-foreground"
              onClick={isSearchOpen ? closeSearch : openSearch}
            >
              {isSearchOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Search className="h-5 w-5 sm:h-6 sm:w-6" />}
            </Button>
            
            {/* Dark Mode Toggle — visible on all screen sizes */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-secondary hover:text-foreground"
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Sun className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
            
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-secondary hover:text-foreground">
                <ShoppingBag className="translate-y-[1px] h-5 w-5 sm:h-6 sm:w-6" />
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-black text-[10px] font-medium text-white flex items-center justify-center dark:bg-white dark:text-black">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Button>
            </Link>
            
            {/* Account dropdown — visible on ALL screen sizes (desktop + mobile) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-secondary hover:text-foreground">
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <AccountDropdownContent
                  user={user}
                  isAuthenticated={isAuthenticated}
                  handleLogout={handleLogout}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Right side icons (mobile-only, no translate offsets) ── */}
          <div className="sm:hidden flex items-center gap-1">
            {/* Mobile search icon */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-secondary hover:text-foreground"
              onClick={openSearch}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Mobile dark mode */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-secondary hover:text-foreground"
              onClick={toggleTheme}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
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

            {/* Mobile user dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-secondary hover:text-foreground">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <AccountDropdownContent
                  user={user}
                  isAuthenticated={isAuthenticated}
                  handleLogout={handleLogout}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* ── Mobile: 3 nav tabs below the logo row (visible on mobile only) ── */}
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

        {/* ── Mobile search bar (expands below tabs when active) ── */}
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

        {/* ── Email verification banner ── */}
        {isAuthenticated && user && !user.isEmailVerified && (
          <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  Email not verified. Some actions like checkout and thrift submissions are disabled until you verify.
                </span>
              </div>
              <Link
                to="/settings?verify=email"
                className="text-xs sm:text-sm font-semibold underline underline-offset-2 text-amber-800 hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
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