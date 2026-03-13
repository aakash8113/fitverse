import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, KeyRound, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/api";
import logoBlack from "@/assets/logo_black.png";
import logoWhite from "@/assets/logo_white.png";
import { useTheme } from "@/contexts/ThemeContext";

type Step = "request" | "reset" | "success";

export default function ForgotPassword() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsRequesting(true);
    try {
      const response = await authApi.forgotPassword({ email: email.trim() });
      if (response.success) {
        setStep("reset");
        toast({
          title: "OTP sent",
          description: response.message || "OTP has been sent to your email.",
        });
      } else {
        throw new Error(response.message || "Failed to send reset OTP");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to send reset OTP";

      toast({
        title: "Request failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) return;

    setIsResending(true);
    try {
      const response = await authApi.forgotPassword({ email: email.trim() });
      if (response.success) {
        toast({
          title: "OTP resent",
          description: response.message || "A new OTP has been sent to your email.",
        });
      } else {
        throw new Error(response.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      toast({
        title: "Resend failed",
        description: error.response?.data?.message || error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.trim().length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "OTP must be 6 digits.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please enter the same password in both fields.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      const response = await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      if (response.success) {
        setStep("success");
        toast({
          title: "Password reset successful",
          description: "You can now login using your new password.",
        });
      } else {
        throw new Error(response.message || "Failed to reset password");
      }
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.response?.data?.message || error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img
            src={theme === "dark" ? logoWhite : logoBlack}
            alt="Fitverse Logo"
            className="h-10 w-10 object-contain translate-y-[-5px]"
          />
          <span
            className="text-[26px] font-bold tracking-wider leading-none"
            style={{ fontFamily: "Mokoto, sans-serif" }}
          >
            FITVERSE
          </span>
        </Link>

        {/* Forgot Password Card */}
        <div className="glass rounded-2xl p-8 border border-border/50">
          {step === "request" ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
                <p className="text-muted-foreground">
                  Enter your email and we'll send a verification OTP to reset your password.
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" size="lg" disabled={isRequesting}>
                  {isRequesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send Verification OTP"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </>
          ) : step === "reset" ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
                <p className="text-muted-foreground">
                  Enter the OTP sent to <span className="font-medium text-foreground">{email}</span> and set a new password.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification OTP</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="otp"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="6-digit OTP"
                      className="pl-10"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      minLength={8}
                      placeholder="Minimum 8 characters"
                      className="pl-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      minLength={8}
                      placeholder="Re-enter new password"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" size="lg" disabled={isResetting}>
                  {isResetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-3">
                <Button variant="outline" className="w-full" onClick={handleResendOtp} disabled={isResending}>
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resending OTP...
                    </>
                  ) : (
                    "Resend OTP"
                  )}
                </Button>

                <Button variant="ghost" className="w-full" onClick={() => setStep("request")}>Use another email</Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Password Updated</h2>
                <p className="text-muted-foreground">
                  Your password has been reset successfully for{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="mb-2">Next step:</p>
                <ul className="text-left space-y-1 ml-4 list-disc">
                  <li>Go to Sign In and use your new password</li>
                  <li>If login fails, request a fresh OTP and reset again</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStep("request");
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Reset Another Account
                </Button>

                <Link to="/login">
                  <Button variant="ghost" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need help?{" "}
          <Link to="/contact" className="text-accent hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
