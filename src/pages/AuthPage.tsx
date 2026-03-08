import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !acceptedTerms) {
      toast.error("Please accept the Terms & Conditions and Disclaimer");
      return;
    }
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) toast.error(error.message);
      else { toast.success("Welcome back!"); navigate("/"); }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) toast.error(error.message);
      else toast.success("Account created successfully! 🎉");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="bg-card rounded-2xl shadow-soft border border-border p-8">
          <div className="flex items-center gap-2 font-display font-bold text-xl mb-2 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-foreground">Spark</span>
            <span className="text-gradient-warm">Guidance</span>
          </div>

          <p className="text-center text-muted-foreground text-sm mb-8">
            {isLogin ? "Welcome back! Sign in to continue." : "Create your innovator account."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name" className="mt-1.5 rounded-xl" required={!isLogin} />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="mt-1.5 rounded-xl" required />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="mt-1.5 rounded-xl" required minLength={6} />
            </div>

            {/* Terms & Disclaimer for signup */}
            {!isLogin && (
              <div className="p-3 bg-secondary/50 rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="rounded mt-1"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline font-medium" target="_blank">
                      Terms & Conditions
                    </Link>{" "}
                    and have read the{" "}
                    <Link to="/disclaimer" className="text-primary hover:underline font-medium" target="_blank">
                      Disclaimer
                    </Link>
                    . I understand that AI analysis is for informational purposes only.
                  </label>
                </div>
              </div>
            )}

            <Button variant="hero" className="w-full" disabled={loading || (!isLogin && !acceptedTerms)}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
