import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, Calendar, Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "delivered" | "shipped" | "processing" | "cancelled";
  total: number;
  itemCount: number;
}

const orders: Order[] = [
  {
    id: "1",
    orderNumber: "FV-2024-001234",
    date: "Feb 24, 2026",
    status: "delivered",
    total: 667.0,
    itemCount: 3,
  },
  {
    id: "2",
    orderNumber: "FV-2024-001189",
    date: "Feb 18, 2026",
    status: "shipped",
    total: 329.0,
    itemCount: 1,
  },
  {
    id: "3",
    orderNumber: "FV-2024-001095",
    date: "Feb 10, 2026",
    status: "delivered",
    total: 149.0,
    itemCount: 1,
  },
  {
    id: "4",
    orderNumber: "FV-2024-000987",
    date: "Feb 5, 2026",
    status: "processing",
    total: 249.0,
    itemCount: 2,
  },
];

const statusStyles = {
  delivered: "bg-green-500/10 text-green-700 border-green-200",
  shipped: "bg-blue-500/10 text-blue-700 border-blue-200",
  processing: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
};

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

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
            <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
              <TabsTrigger value="all">All Orders</TabsTrigger>
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
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block glass rounded-2xl border border-border/50 p-6 hover:border-accent hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">
                          {order.orderNumber}
                        </h3>
                        <Badge
                          variant="outline"
                          className={statusStyles[order.status]}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {order.date}
                        </span>
                        <span>•</span>
                        <span>
                          {order.itemCount}{" "}
                          {order.itemCount === 1 ? "item" : "items"}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-2xl border border-border/50">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery || activeTab !== "all"
                  ? "No Orders Found"
                  : "No Orders Yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || activeTab !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start shopping to see your orders here"}
              </p>
              {!searchQuery && activeTab === "all" && (
                <Link to="/shop">
                  <Button size="lg">Start Shopping</Button>
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
