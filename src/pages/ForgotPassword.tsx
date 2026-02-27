import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Password reset requested for:", email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="gradient-ai rounded-lg p-2">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Fitverse</span>
        </Link>

        {/* Forgot Password Card */}
        <div className="glass rounded-2xl p-8 border border-border/50">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
                <p className="text-muted-foreground">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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

                <Button type="submit" className="w-full h-11" size="lg">
                  Send Reset Link
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
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                <p className="text-muted-foreground">
                  We've sent password reset instructions to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="mb-2">Didn't receive the email?</p>
                <ul className="text-left space-y-1 ml-4 list-disc">
                  <li>Check your spam/junk folder</li>
                  <li>Verify the email address is correct</li>
                  <li>Wait a few minutes and check again</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsSubmitted(false)}
                >
                  Try Another Email
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
