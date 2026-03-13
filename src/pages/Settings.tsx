import { useEffect, useState } from "react";
import { User, Mail, Phone, Lock, Bell, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);

  // Profile edit state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!user) return;
    const parts = (user.name || "").trim().split(/\s+/).filter(Boolean);
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" "));
    setEmail(user.email || "");
    setPhone(user.phone || "");
  }, [user]);

  useEffect(() => {
    if (!user || user.isEmailVerified) return;
    const params = new URLSearchParams(location.search);
    if (params.get("verify") === "email") {
      setShowEmailOtpInput(true);
      toast({
        title: "Email verification required",
        description: "Some account features are disabled until your email is verified.",
      });
    }
  }, [location.search, user, toast]);

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: async (res) => {
      await refreshUser();
      toast({
        title: "Profile updated",
        description: res.message || "Your account information has been saved.",
      });
      if (res.data && !res.data.isEmailVerified) {
        setShowEmailOtpInput(true);
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to update profile.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

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

  const resendEmailOtpMutation = useMutation({
    mutationFn: (targetEmail: string) => authApi.resendOtp({ email: targetEmail }),
    onSuccess: (res) => {
      toast({ title: "Verification OTP sent", description: res.message || "Please check your email inbox." });
      setShowEmailOtpInput(true);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to send verification OTP.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (payload: { email: string; otp: string }) => authApi.verifyEmail(payload),
    onSuccess: async (res) => {
      await refreshUser();
      toast({ title: "Email verified", description: res.message || "Your email is now verified." });
      setEmailOtp("");
      setShowEmailOtpInput(false);

      const redirectPath = sessionStorage.getItem("fitverse_post_verify_redirect");
      if (redirectPath) {
        sessionStorage.removeItem("fitverse_post_verify_redirect");
        if (redirectPath !== "/settings" && redirectPath !== "/settings?verify=email") {
          navigate(redirectPath);
        }
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to verify email.";
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const f = firstName.trim();
    const l = lastName.trim();
    const fullName = [f, l].filter(Boolean).join(" ");
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!f) {
      toast({ title: "Error", description: "First name is required.", variant: "destructive" });
      return;
    }

    if (!trimmedEmail) {
      toast({ title: "Error", description: "Email is required.", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!emailRegex.test(trimmedEmail)) {
      toast({ title: "Error", description: "Please provide a valid email address.", variant: "destructive" });
      return;
    }

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (trimmedPhone && !phoneRegex.test(trimmedPhone)) {
      toast({ title: "Error", description: "Please provide a valid phone number.", variant: "destructive" });
      return;
    }

    if (!window.confirm("Are you sure you want to save these profile changes?")) {
      return;
    }

    updateProfileMutation.mutate({
      name: fullName,
      email: trimmedEmail,
      phone: trimmedPhone || null,
    });
  };

  const handleResendVerification = () => {
    const draftEmail = email.trim().toLowerCase();
    const currentUserEmail = user?.email?.toLowerCase() || "";

    if (!user) return;

    if (draftEmail !== currentUserEmail) {
      toast({
        title: "Save changes first",
        description: "Please save your updated email before requesting OTP verification.",
        variant: "destructive",
      });
      return;
    }

    resendEmailOtpMutation.mutate(currentUserEmail);
  };

  const handleVerifyEmail = () => {
    if (!user?.email) return;
    const otp = emailOtp.trim();

    if (!otp) {
      toast({ title: "Error", description: "Please enter the OTP sent to your email.", variant: "destructive" });
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast({ title: "Error", description: "OTP must be exactly 6 digits.", variant: "destructive" });
      return;
    }

    verifyEmailMutation.mutate({ email: user.email, otp });
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

                {!!user && !user.isEmailVerified && (
                  <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Email verification is pending</p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Some features are disabled until verification is complete: checkout, payment, thrift submissions, and return creation.
                    </p>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSaveProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      {user?.isEmailVerified ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">Verified</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">Not Verified</span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                      />
                      {!user?.isEmailVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResendVerification}
                          disabled={resendEmailOtpMutation.isPending}
                        >
                          {resendEmailOtpMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Verify
                        </Button>
                      )}
                    </div>
                    {!user?.isEmailVerified && showEmailOtpInput && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="sm:max-w-xs"
                        />
                        <Button
                          type="button"
                          onClick={handleVerifyEmail}
                          disabled={verifyEmailMutation.isPending}
                        >
                          {verifyEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirm OTP
                        </Button>
                      </div>
                    )}
                    {!user?.isEmailVerified && (
                      <p className="text-xs text-muted-foreground">
                        Verify this email to unlock restricted features.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
}
