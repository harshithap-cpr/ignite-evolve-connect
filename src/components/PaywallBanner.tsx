import { motion } from "framer-motion";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PaywallBannerProps {
  feature: string;
  remainingFree: number;
  canUse: boolean;
  isPaid: boolean;
}

const PaywallBanner = ({ feature, remainingFree, canUse, isPaid }: PaywallBannerProps) => {
  const navigate = useNavigate();

  if (isPaid) return null;

  if (canUse) {
    return (
      <div className="p-3 bg-spark-amber/10 rounded-xl text-sm text-spark-amber text-center border border-spark-amber/20">
        ⚠️ You have <strong>{remainingFree} free {feature}</strong> remaining. Subscribe to get unlimited access.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border-2 border-primary/30 p-6 text-center space-y-3"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-display font-bold text-lg text-card-foreground">
        Free limit reached
      </h3>
      <p className="text-muted-foreground text-sm">
        You've used your free {feature}. Upgrade to <strong>Pro (₹99/mo)</strong> or <strong>Premium (₹250/mo)</strong> for unlimited access.
      </p>
      <Button variant="hero" size="sm" onClick={() => navigate("/#pricing")}>
        <Crown className="w-4 h-4 mr-2" /> Upgrade Now
      </Button>
    </motion.div>
  );
};

export default PaywallBanner;
