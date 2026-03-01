import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Heart,
  Edit2,
  ChevronRight,
  Calendar,
  CreditCard,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface UserInfo {
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  avatar?: string;
}

interface OrderSummary {
  id: string;
  date: string;
  total: number;
  status: "Delivered" | "Processing" | "Shipped";
  itemCount: number;
}

export default function Account() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    joinDate: "January 2024",
  });

  const [editedInfo, setEditedInfo] = useState(userInfo);

  // Mock data for testing
  const stats = {
    totalOrders: 12,
    wishlistItems: 4,
    savedAddresses: 2,
    paymentMethods: 2,
  };

  const recentOrders: OrderSummary[] = [
    {
      id: "ORD-2024-001",
      date: "Feb 20, 2026",
      total: 329.00,
      status: "Delivered",
      itemCount: 2,
    },
    {
      id: "ORD-2024-002",
      date: "Feb 15, 2026",
      total: 189.00,
      status: "Processing",
      itemCount: 1,
    },
    {
      id: "ORD-2024-003",
      date: "Feb 10, 2026",
      total: 456.00,
      status: "Shipped",
      itemCount: 3,
    },
  ];

  const handleSaveProfile = () => {
    setUserInfo(editedInfo);
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setEditedInfo(userInfo);
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">
            Manage your profile and track your orders
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Stats */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-foreground text-background flex items-center justify-center text-3xl font-bold mb-4">
                  {userInfo.name.split(" ").map(n => n[0]).join("")}
                </div>
                <h2 className="text-xl font-semibold mb-1">{userInfo.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Member since {userInfo.joinDate}
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{userInfo.email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{userInfo.phone}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <Link
                  to="/orders"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="font-semibold">{stats.totalOrders}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>

                <Link
                  to="/wishlist"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Wishlist</p>
                      <p className="font-semibold">{stats.wishlistItems} items</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>

                <Link
                  to="/addresses"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Addresses</p>
                      <p className="font-semibold">{stats.savedAddresses} saved</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>

                <Link
                  to="/payment-methods"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Methods</p>
                      <p className="font-semibold">{stats.paymentMethods} cards</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Details & Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                {!isEditingProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                ) : null}
              </div>

              {!isEditingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-sm">Full Name</Label>
                    <p className="font-medium mt-1">{userInfo.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Email Address</Label>
                    <p className="font-medium mt-1">{userInfo.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Phone Number</Label>
                    <p className="font-medium mt-1">{userInfo.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Member Since</Label>
                    <p className="font-medium mt-1">{userInfo.joinDate}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Full Name</Label>
                      <Input
                        id="edit-name"
                        value={editedInfo.name}
                        onChange={(e) =>
                          setEditedInfo({ ...editedInfo, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        value={editedInfo.phone}
                        onChange={(e) =>
                          setEditedInfo({ ...editedInfo, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email Address</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editedInfo.email}
                      onChange={(e) =>
                        setEditedInfo({ ...editedInfo, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <Link to="/orders">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">{order.id}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {order.date}
                          </span>
                          <span>•</span>
                          <span>{order.itemCount} items</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{order.total.toFixed(2)}</p>
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full mt-1 inline-block",
                          order.status === "Delivered" &&
                            "bg-green-500/10 text-green-700",
                          order.status === "Processing" &&
                            "bg-yellow-500/10 text-yellow-700",
                          order.status === "Shipped" &&
                            "bg-blue-500/10 text-blue-700"
                        )}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
