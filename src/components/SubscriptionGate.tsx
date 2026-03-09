import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PaywallBanner from "@/components/PaywallBanner";

interface SubscriptionGateProps {
  children: ReactNode;
  feature: string;
  /** Show a teaser preview (e.g. first 2 items) before the gate */
  previewCount?: number;
}

const SubscriptionGate = ({ children, feature }: SubscriptionGateProps) => {
  const { user } = useAuth();
  const { isPaid, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) return null;

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border-2 border-primary/30 p-8 text-center space-y-4 my-8"
      >
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-display font-bold text-xl text-card-foreground">
          Sign in to access {feature}
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Create an account and subscribe to unlock full access to {feature}.
        </p>
        <Button variant="hero" onClick={() => navigate("/auth")}>
          Sign In to Continue
        </Button>
      </motion.div>
    );
  }

  if (!isPaid) {
    return (
      <div className="my-8">
        <PaywallBanner
          feature={feature}
          remainingFree={0}
          canUse={false}
          isPaid={false}
          defaultShowPlans={false}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;
