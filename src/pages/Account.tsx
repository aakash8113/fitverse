import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Heart,
  ChevronRight,
  Calendar,
  CreditCard,
  Settings,
  Shield,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, addressesApi, ApiResponse, Order, Address } from "@/services/api";

export default function Account() {
  const { user } = useAuth();

  // Fetch orders count
  const { data: ordersData } = useQuery<ApiResponse<Order[]>>({
    queryKey: ["orders"],
    queryFn: () => ordersApi.getMyOrders(),
  });

  // Fetch addresses count
  const { data: addressesData } = useQuery({
    queryKey: ["addresses"],
    queryFn: addressesApi.getAddresses,
  });

  const orders = ordersData?.data || [];
  const addresses = addressesData?.data || [];
  const recentOrders = orders.slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusStyles = {
    PENDING: "bg-yellow-500/10 text-yellow-700",
    PAID: "bg-blue-500/10 text-blue-700",
    PROCESSING: "bg-purple-500/10 text-purple-700",
    SHIPPED: "bg-blue-500/10 text-blue-700",
    DELIVERED: "bg-green-500/10 text-green-700",
    CANCELLED: "bg-red-500/10 text-red-700",
  };

  const stats = {
    totalOrders: orders.length,
    wishlistItems: 0, // We don't have wishlist API yet
    savedAddresses: addresses.length,
    paymentMethods: 0, // Placeholder
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading account...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="glass rounded-2xl border border-border/50 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Member since {formatDate(user.createdAt || new Date().toISOString())}
                  </p>
                  {user.isEmailVerified && (
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs text-green-600">Verified</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <Link to="/settings">
                <Button variant="outline" className="w-full gap-2">
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="glass rounded-2xl border border-border/50 p-6">
              <h3 className="font-semibold mb-4">Account Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <Package className="w-6 h-6 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <MapPin className="w-6 h-6 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{stats.savedAddresses}</p>
                  <p className="text-xs text-muted-foreground">Addresses</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                to="/orders"
                className="glass rounded-2xl border border-border/50 p-6 hover:border-accent transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-accent transition-colors">
                        My Orders
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Track & manage orders
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </Link>

              <Link
                to="/addresses"
                className="glass rounded-2xl border border-border/50 p-6 hover:border-accent transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-accent transition-colors">
                        Addresses
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage delivery addresses
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </Link>

              <Link
                to="/wishlist"
                className="glass rounded-2xl border border-border/50 p-6 hover:border-accent transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-accent transition-colors">
                        Wishlist
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Your favorite items
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </Link>

              <Link
                to="/settings"
                className="glass rounded-2xl border border-border/50 p-6 hover:border-accent transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-accent transition-colors">
                        Settings
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Account preferences
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </Link>
            </div>

            {/* Recent Orders */}
            <div className="glass rounded-2xl border border-border/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Recent Orders</h2>
                <Link to="/orders">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order: any) => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-accent transition-all group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold group-hover:text-accent transition-colors">
                            {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              statusStyles[order.status as keyof typeof statusStyles]
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatOrderDate(order.createdAt)}
                          </span>
                          <span>
                            {order.items?.length || 0}{" "}
                            {order.items?.length === 1 ? "item" : "items"}
                          </span>
                          <span className="font-semibold text-foreground">
                            ₹{Number(order.total).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No orders yet</p>
                  <Link to="/shop">
                    <Button>Start Shopping</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
