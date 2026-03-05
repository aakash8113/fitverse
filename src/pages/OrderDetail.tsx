import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Package, Truck, CheckCircle, Loader2, RotateCcw } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi, returnsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const statusStyles = {
  PENDING: { bg: "bg-yellow-500/10", text: "text-yellow-700", border: "border-yellow-200" },
  PAID: { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-200" },
  PROCESSING: { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-200" },
  SHIPPED: { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-200" },
  DELIVERED: { bg: "bg-green-500/10", text: "text-green-700", border: "border-green-200" },
  CANCELLED: { bg: "bg-red-500/10", text: "text-red-700", border: "border-red-200" },
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch order details
  const { data: returnsData } = useQuery({
    queryKey: ["my-returns"],
    queryFn: returnsApi.getMyRequests,
  });

  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.getOrder(id!),
    enabled: !!id,
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: ordersApi.cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Success",
        description: "Order cancelled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
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
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !orderData?.data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-container py-12">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2 text-destructive">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {(error as Error)?.message || "The order you're looking for doesn't exist."}
            </p>
            <Link to="/orders">
              <Button>Back to Orders</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const order = orderData.data;
  const statusStyle = statusStyles[order.status as keyof typeof statusStyles] || statusStyles.PENDING;

  const canCancel = order.status === "PENDING" || order.status === "PAID";

  const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt);
  const daysSinceDelivery = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);

  // Find any existing return request for this order (ignore cancelled/rejected — those allow re-requesting)
  const allReturns = returnsData?.data || [];
  const activeReturn = allReturns.find(
    (r) => r.orderId === order.id && !["CANCELLED", "REJECTED"].includes(r.status)
  );
  const canReturn = order.status === "DELIVERED" && daysSinceDelivery <= 7 && !activeReturn;

  // Order item IDs that have been replaced (replacement shipped or completed)
  const replacedOrderItemIds = new Set(
    allReturns
      .filter(
        (r) =>
          r.orderId === order.id &&
          r.type === "REPLACEMENT" &&
          ["REPLACEMENT_SHIPPED", "COMPLETED"].includes(r.status)
      )
      .flatMap((r) => r.items.map((i) => i.orderItemId))
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Header */}
              <div className="glass rounded-2xl border border-border/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">
                      Order {order.orderNumber || `#${order.id.slice(0, 8)}`}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                  >
                    {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                  </Badge>
                </div>

                {canCancel && (
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to cancel this order?")) {
                        cancelOrderMutation.mutate(order.id);
                      }
                    }}
                    disabled={cancelOrderMutation.isPending}
                  >
                    {cancelOrderMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel Order"
                    )}
                  </Button>
                )}

                {canReturn && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate(`/returns/new?orderId=${order.id}`)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Request Return / Replacement
                  </Button>
                )}

                {/* Show existing return request status */}
                {activeReturn && (
                  <div className="flex items-center gap-3 mt-2 p-3 rounded-xl bg-muted/50 border border-border/60">
                    <RotateCcw className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium">
                        {activeReturn.type === "REPLACEMENT" ? "Replacement" : "Return"} request
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {activeReturn.status === "COMPLETED" ? "completed" : "in progress"} · {activeReturn.requestNumber}
                      </span>
                    </div>
                    <Link to={`/returns/${activeReturn.id}`}>
                      <Button variant="outline" size="sm">View Request</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="glass rounded-2xl border border-border/50 p-6">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                  {order.items.map((item: any, index: number) => {
                    const imageUrl = item.product?.images?.[0]?.startsWith("http")
                      ? item.product.images[0]
                      : `http://localhost:5000/${item.product?.images?.[0] || ""}`;

                    const isReplaced = replacedOrderItemIds.has(item.id);

                    return (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border hover:border-accent transition-colors"
                      >
                        {/* Image */}
                        <Link
                          to={`/product/${item.product?.id}`}
                          className="w-full sm:w-20 h-40 sm:h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0"
                        >
                          <img
                            src={imageUrl}
                            alt={item.product?.name || "Product"}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/80?text=No+Image";
                            }}
                          />
                        </Link>
                        {/* Info */}
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link to={`/product/${item.product?.id}`}>
                                <h3 className="font-semibold hover:text-accent transition-colors">
                                  {item.product?.name || item.productName || "Product"}
                                </h3>
                              </Link>
                              {isReplaced && (
                                <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] px-2 py-0.5 font-semibold" variant="outline">
                                  Replaced
                                </Badge>
                              )}
                            </div>
                            <p className="font-semibold flex-shrink-0">
                              ₹{(Number(item.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Price: ₹{Number(item.price).toFixed(2)}
                          </p>
                          {item.size && (
                            <p className="text-sm text-muted-foreground">
                              Size:{" "}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-foreground text-background text-xs font-bold tracking-wide">
                                {item.size}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="glass rounded-2xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Shipping Address</h2>
                </div>
                {order.address ? (
                  <div className="pl-13">
                    <p className="font-medium mb-1">{order.address.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.address.addressLine1}
                      {order.address.addressLine2 && `, ${order.address.addressLine2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.address.city}, {order.address.state} {order.address.zipCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.address.country}</p>
                    <p className="text-sm text-muted-foreground mt-2">{order.address.phone}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No address information available</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="glass rounded-2xl border border-border/50 p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{Number(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>₹{Number(order.shipping).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
                
                <Separator className="my-4" />

                {/* Payment Method */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Payment Method</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.paymentMethod === "COD" && "Cash on Delivery"}
                    {order.paymentMethod === "CARD" && "Credit/Debit Card"}
                    {order.paymentMethod === "WALLET" && "Digital Wallet"}
                  </p>
                </div>

                {order.status === "DELIVERED" && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Delivered On</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveredAt ? formatDate(order.deliveredAt) : "Not specified"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Need Help */}
              <div className="glass rounded-2xl border border-border/50 p-6">
                <h3 className="font-semibold mb-4">Need Help?</h3>
                <div className="space-y-3">
                  <Link to="/contact">
                    <Button variant="outline" className="w-full">
                      Contact Support
                    </Button>
                  </Link>
                  <Link to={`/product/${order.items[0]?.productId}`}>
                    <Button variant="outline" className="w-full">
                      Buy Again
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
