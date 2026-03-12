import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Phone, Lock, Bell, CreditCard, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/api";

export default function Settings() {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to update password.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "New password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings
            </p>
          </div>

          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6">
              <div className="glass rounded-2xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="text-xl font-semibold">Personal Information</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Doe" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        defaultValue="john.doe@example.com"
                        className="flex-1"
                      />
                      <Button variant="outline">Change</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" defaultValue="(555) 123-4567" />
                  </div>

                  <div className="pt-4">
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="glass rounded-2xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="text-xl font-semibold">Notification Preferences</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive order updates and shipping notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get text messages for important order updates
                      </p>
                    </div>
                    <Switch
                      checked={smsNotifications}
                      onCheckedChange={setSmsNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new products, sales, and promotions
                      </p>
                    </div>
                    <Switch
                      checked={marketingEmails}
                      onCheckedChange={setMarketingEmails}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security" className="space-y-6">
              <div className="glass rounded-2xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Lock className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="text-xl font-semibold">Password & Security</h2>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>

              <div className="glass rounded-2xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="text-xl font-semibold">Payment Methods</h2>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Manage your saved payment methods for faster checkout
                </p>

                <Link to="/payment-methods">
                  <Button variant="outline">Manage Payment Methods</Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
}
