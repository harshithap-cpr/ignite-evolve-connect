import { ReactNode, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, Crown, IndianRupee, QrCode, Copy, CheckCircle, Upload, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UPI_ID = "hp123cpr@oksbi";

const plans = [
  {
    name: "Pro",
    price: "₹99",
    amount: 99,
    period: "/month",
    description: "For serious innovators",
    features: [
      "Unlimited feature access",
      "Priority mentor booking",
      "All premium courses",
      "Team collaboration tools",
    ],
  },
  {
    name: "Premium",
    price: "₹250",
    amount: 250,
    period: "/month",
    description: "Full access + personal guidance",
    features: [
      "Everything in Pro",
      "Personal innovation mentor",
      "Investor pitch opportunities",
      "Priority support",
    ],
  },
];

interface SubscriptionGateProps {
  children: ReactNode;
  feature: string;
  previewCount?: number;
}

const SubscriptionGate = ({ children, feature }: SubscriptionGateProps) => {
  const { user } = useAuth();
  const { isPaid, loading } = useSubscription();
  const navigate = useNavigate();
  const [showPlans, setShowPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [copied, setCopied] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [txnSubmitting, setTxnSubmitting] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const upiPaymentLink = selectedPlan
    ? `upi://pay?pa=${UPI_ID}&pn=InnovateSpark&am=${selectedPlan.amount}&cu=INR&tn=${selectedPlan.name}%20Plan%20Subscription`
    : "";

  const qrCodeUrl = selectedPlan
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPaymentLink)}`
    : "";

  const copyUpiId = async () => {
    await navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTxnSubmit = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    if (!txnId.trim()) { toast.error("Please enter transaction ID"); return; }
    setTxnSubmitting(true);
    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan: selectedPlan?.name.toLowerCase() || "pro",
      status: "pending",
      transaction_id: txnId.trim(),
      amount: selectedPlan?.amount || 99,
    });
    setTxnSubmitting(false);
    if (error) { toast.error("Failed to submit"); return; }
    setPaymentSubmitted(true);
    toast.success("Payment submitted! We'll verify & activate within 24 hours. 🎉");
  };

  // Poll for subscription activation after payment submission
  useEffect(() => {
    if (!paymentSubmitted || !user) return;
    setCheckingStatus(true);
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (data) {
        toast.success("🎉 Subscription activated! Enjoy full access.");
        setCheckingStatus(false);
        setPaymentSubmitted(false);
        setSelectedPlan(null);
        setShowPlans(false);
        // Force page reload to refresh subscription state
        window.location.reload();
      }
    }, 10000); // check every 10 seconds
    return () => clearInterval(interval);
  }, [paymentSubmitted, user]);

  const handleClose = useCallback(() => {
    setSelectedPlan(null);
    setShowPlans(false);
    setTxnId("");
    setPaymentSubmitted(false);
    setCheckingStatus(false);
  }, []);

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
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border-2 border-primary/30 p-8 text-center space-y-4 my-8"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-display font-bold text-xl text-card-foreground">
            Unlock {feature}
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Subscribe to <strong>Pro (₹99/mo)</strong> or <strong>Premium (₹250/mo)</strong> to get full access.
          </p>
          <Button
            variant="hero"
            size="lg"
            className="text-base px-8 py-3 shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => setShowPlans(true)}
          >
            <Crown className="w-5 h-5 mr-2" /> Pay Now
          </Button>

          {paymentSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-spark-amber/10 border border-spark-amber/30 rounded-xl"
            >
              <div className="flex items-center justify-center gap-2 text-spark-amber">
                {checkingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                <span className="text-sm font-medium">
                  Payment submitted! Waiting for admin verification...
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your access will unlock automatically once verified (usually within 24 hours).
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Plan Selection Dialog */}
        <Dialog open={showPlans && !selectedPlan} onOpenChange={(open) => !open && setShowPlans(false)}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-display">
                <Crown className="w-5 h-5 text-primary" /> Choose Your Plan
              </DialogTitle>
              <DialogDescription>Unlock unlimited access to all features</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {plans.map((plan) => (
                <motion.div
                  key={plan.name}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="rounded-xl border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-display font-bold text-card-foreground">{plan.name}</h4>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold font-display text-card-foreground">{plan.price}</span>
                      <span className="text-xs text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mt-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-card-foreground">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button variant="hero" size="sm" className="w-full mt-3">
                    <IndianRupee className="w-3.5 h-3.5 mr-1" /> Select {plan.name}
                  </Button>
                </motion.div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={!!selectedPlan} onOpenChange={(open) => { if (!open) handleClose(); }}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-display">
                <QrCode className="w-5 h-5 text-primary" /> Pay for {selectedPlan?.name} Plan
              </DialogTitle>
              <DialogDescription>
                Scan QR or tap "Pay Now" to pay <span className="font-semibold text-foreground">{selectedPlan?.price}{selectedPlan?.period}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-5 py-4">
              {/* QR Code */}
              <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
                <img src={qrCodeUrl} alt="UPI QR Code" width={220} height={220} className="rounded-lg" />
              </div>

              {/* UPI ID */}
              <div className="w-full flex items-center gap-2 bg-muted rounded-lg px-4 py-3">
                <span className="text-sm text-muted-foreground">UPI ID:</span>
                <span className="font-mono font-semibold text-foreground flex-1">{UPI_ID}</span>
                <Button variant="ghost" size="icon" onClick={copyUpiId} className="shrink-0">
                  {copied ? <CheckCircle className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </Button>
              </div>

              {/* Pay Now Deep Link */}
              <a href={upiPaymentLink} className="w-full">
                <Button variant="hero" size="lg" className="w-full text-base">
                  <IndianRupee className="w-5 h-5 mr-2" /> Pay Now — {selectedPlan?.price}
                </Button>
              </a>
              <p className="text-xs text-muted-foreground text-center">
                Opens GPay / PhonePe / Paytm directly on your phone.
              </p>

              {/* Transaction ID submission */}
              {!paymentSubmitted ? (
                <div className="w-full border-t border-border pt-4 space-y-3">
                  <p className="text-sm font-semibold text-card-foreground text-center">
                    After payment, enter your transaction ID:
                  </p>
                  <Input
                    placeholder="Enter UPI Transaction ID"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    className="rounded-xl"
                  />
                  <Button
                    variant="hero"
                    className="w-full"
                    disabled={!txnId.trim() || txnSubmitting}
                    onClick={handleTxnSubmit}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {txnSubmitting ? "Submitting..." : "Submit for Verification"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Or <a href="/payment-verification" className="text-primary underline">upload screenshot</a> for faster verification.
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full p-4 bg-primary/10 border border-primary/30 rounded-xl text-center space-y-2"
                >
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Payment Submitted!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your subscription will be activated once verified by our team.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking activation status...
                  </div>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleClose}>
                    Close & Continue
                  </Button>
                </motion.div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;
