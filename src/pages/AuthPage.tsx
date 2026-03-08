import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or continue with</span></div>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error("Google sign-in failed");
            }}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>

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
