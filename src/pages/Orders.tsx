import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, Calendar, Search, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi, Order, ApiResponse } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const statusStyles = {
  PENDING: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  PAID: "bg-blue-500/10 text-blue-700 border-blue-200",
  PROCESSING: "bg-purple-500/10 text-purple-700 border-purple-200",
  SHIPPED: "bg-blue-500/10 text-blue-700 border-blue-200",
  DELIVERED: "bg-green-500/10 text-green-700 border-green-200",
  CANCELLED: "bg-red-500/10 text-red-700 border-red-200",
};

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: ordersData, isLoading, error } = useQuery<ApiResponse<Order[]>>({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getMyOrders(),
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: ordersApi.cancelOrder,
    onSuccess: () => {
      setCancellingId(null);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Success",
        description: "Order cancelled successfully",
      });
    },
    onError: () => {
      setCancellingId(null);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    },
  });

  const orders = ordersData?.data || [];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" || order.status === activeTab.toUpperCase();
    return matchesSearch && matchesTab;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-container py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-container py-12">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2 text-destructive">Error Loading Orders</h2>
            <p className="text-muted-foreground mb-6">
              {(error as Error).message || "Failed to load orders. Please try again."}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">
              View and track all your orders
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-2 lg:grid-cols-7 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="shipped">Shipped</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Orders List */}
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="glass rounded-2xl border border-border/50 p-6 hover:border-accent hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">
                          {order.orderNumber || `Order #₹{order.id.slice(0, 8)}`}
                        </h3>
                        <Badge
                          variant="outline"
                          className={
                            statusStyles[order.status as keyof typeof statusStyles]
                          }
                        >
                          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(order.createdAt)}
                        </span>
                        <span>•</span>
                        <span>
                          {order.items?.length || 0}{" "}
                          {order.items?.length === 1 ? "item" : "items"}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">
                          ₹{Number(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/orders/₹{order.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {order.items.slice(0, 4).map((item, index) => {
                        const imageUrl = item.productImage?.startsWith("http")
                          ? item.productImage
                          : `http://localhost:5000/${item.productImage || ""}`;

                        return (
                          <div
                            key={index}
                            className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0"
                          >
                            <img
                              src={imageUrl}
                              alt={item.productName || "Product"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://via.placeholder.com/64?text=No+Image";
                              }}
                            />
                          </div>
                        );
                      })}
                      {order.items.length > 4 && (
                        <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancel button for eligible orders */}
                  {(order.status === "PENDING" || order.status === "PAID") && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (cancellingId) return;
                          if (
                            confirm(
                              "Are you sure you want to cancel this order?"
                            )
                          ) {
                            setCancellingId(order.id);
                            cancelOrderMutation.mutate(order.id);
                          }
                        }}
                        disabled={!!cancellingId}
                      >
                        {cancellingId === order.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          "Cancel Order"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No orders found</h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try adjusting your search"
                  : "You haven't placed any orders yet"}
              </p>
              {!searchQuery && (
                <Link to="/shop">
                  <Button>Start Shopping</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
