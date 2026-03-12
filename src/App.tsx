import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import FitverseAI from "./pages/FitverseAI";
import Thrift from "./pages/Thrift";
import ThriftSell from "./pages/ThriftSell";
import ThriftMyListings from "./pages/ThriftMyListings";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import PaymentReturn from "./pages/PaymentReturn";
import OrderConfirmation from "./pages/OrderConfirmation";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import MyAddresses from "./pages/MyAddresses";
import PaymentMethods from "./pages/PaymentMethods";
import Settings from "./pages/Settings";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import SizeGuide from "./pages/SizeGuide";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import TrackOrder from "./pages/TrackOrder";
import Shipping from "./pages/Shipping";
import Collections from "./pages/Collections";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import { AdminGuard } from "@/components/admin/AdminGuard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminShopInventory from "./pages/admin/AdminShopInventory";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminThriftRequests from "./pages/admin/AdminThriftRequests";
import AdminRefurbishment from "./pages/admin/AdminRefurbishment";
import AdminThriftInventory from "./pages/admin/AdminThriftInventory";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import ReturnRequestPage from "./pages/ReturnRequest";
import MyReturns from "./pages/MyReturns";
import ReturnDetail from "./pages/ReturnDetail";
import AdminReturns from "./pages/admin/AdminReturns";
import MyCoins from "./pages/MyCoins";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000, // 30 s — reuse cached data instead of re-fetching immediately
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
          {/* Main Pages */}
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<Index />} />
          
          {/* Shop & Products */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ProductDetails />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/fitverse-ai" element={<FitverseAI />} />
          <Route path="/thrift" element={<Thrift />} />
          <Route path="/thrift/sell" element={<ProtectedRoute requireVerification><ThriftSell /></ProtectedRoute>} />
          <Route path="/thrift/my-listings" element={<ProtectedRoute requireVerification><ThriftMyListings /></ProtectedRoute>} />
          
          {/* Cart & Checkout */}
          <Route path="/cart" element={<ProtectedRoute requireVerification><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute requireVerification><Checkout /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute requireVerification><Payment /></ProtectedRoute>} />
          <Route path="/payment-return" element={<ProtectedRoute requireVerification><PaymentReturn /></ProtectedRoute>} />
          <Route path="/order-confirmation" element={<ProtectedRoute requireVerification><OrderConfirmation /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          
          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Account */}
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute requireVerification><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute requireVerification><OrderDetail /></ProtectedRoute>} />
          <Route path="/addresses" element={<ProtectedRoute requireVerification><MyAddresses /></ProtectedRoute>} />
          <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/coins" element={<ProtectedRoute requireVerification><MyCoins /></ProtectedRoute>} />
          
          {/* Information Pages */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/track-order" element={<TrackOrder />} />
          
          {/* Legal */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/return-policy" element={<ReturnPolicy />} />

          {/* Returns & Replacements */}
          <Route path="/returns/new" element={<ProtectedRoute requireVerification><ReturnRequestPage /></ProtectedRoute>} />
          <Route path="/returns/:id" element={<ProtectedRoute requireVerification><ReturnDetail /></ProtectedRoute>} />
          <Route path="/returns" element={<ProtectedRoute requireVerification><MyReturns /></ProtectedRoute>} />
          
          {/* Admin Panel */}
          <Route path="/admin" element={<AdminGuard><Navigate to="/admin/dashboard" replace /></AdminGuard>} />
          <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
          <Route path="/admin/shop" element={<AdminGuard><AdminShopInventory /></AdminGuard>} />
          <Route path="/admin/thrift-requests" element={<AdminGuard><AdminThriftRequests /></AdminGuard>} />
          <Route path="/admin/refurbishment" element={<AdminGuard><AdminRefurbishment /></AdminGuard>} />
          <Route path="/admin/thrift-inventory" element={<AdminGuard><AdminThriftInventory /></AdminGuard>} />
          <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
          <Route path="/admin/returns" element={<AdminGuard><AdminReturns /></AdminGuard>} />
          <Route path="/admin/coupons" element={<AdminGuard><AdminCoupons /></AdminGuard>} />

          {/* 404 - Must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
