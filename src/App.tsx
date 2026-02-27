import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import FitverseAI from "./pages/FitverseAI";
import Thrift from "./pages/Thrift";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
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
import ForgotPassword from "./pages/ForgotPassword";
import TrackOrder from "./pages/TrackOrder";
import Shipping from "./pages/Shipping";
import Collections from "./pages/Collections";
import SearchResults from "./pages/SearchResults";
import Careers from "./pages/Careers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          
          {/* Cart & Checkout */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/wishlist" element={<Wishlist />} />
          
          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Account */}
          <Route path="/account" element={<Account />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/addresses" element={<MyAddresses />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Information Pages */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/careers" element={<Careers />} />
          
          {/* Legal */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/returns" element={<ReturnPolicy />} />
          
          {/* 404 - Must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
