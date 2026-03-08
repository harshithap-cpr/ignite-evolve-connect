import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Lock, Check, Copy, CheckCircle, QrCode, IndianRupee, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface PaywallBannerProps {
  feature: string;
  remainingFree: number;
  canUse: boolean;
  isPaid: boolean;
  defaultShowPlans?: boolean;
}

const PaywallBanner = ({ feature, remainingFree, canUse, isPaid, defaultShowPlans = false }: PaywallBannerProps) => {
  const [showPlans, setShowPlans] = useState(defaultShowPlans);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [copied, setCopied] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [txnSubmitting, setTxnSubmitting] = useState(false);
  const { user } = useAuth();

  if (isPaid) return null;

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
    toast.success("Payment submitted! We'll verify & activate within 24 hours.");
    setSelectedPlan(null);
    setShowPlans(false);
    setTxnId("");
  };

  const upiPaymentLink = selectedPlan
    ? `upi://pay?pa=${UPI_ID}&pn=InnovateSpark&am=${selectedPlan.amount}&cu=INR&tn=${selectedPlan.name}%20Plan%20Subscription`
    : "";

  const qrCodeUrl = selectedPlan
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPaymentLink)}`
    : "";

  if (canUse) {
    return (
      <div className="p-3 bg-spark-amber/10 rounded-xl text-sm text-spark-amber text-center border border-spark-amber/20">
        ⚠️ You have <strong>{remainingFree} free {feature}</strong> remaining. Subscribe to get unlimited access.
      </div>
    );
  }

  return (
    <>
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
        <Button variant="hero" size="sm" onClick={() => setShowPlans(true)}>
          <Crown className="w-4 h-4 mr-2" /> Upgrade Now
        </Button>
      </motion.div>

      {/* Plans Dialog */}
      <Dialog open={showPlans && !selectedPlan} onOpenChange={(open) => !open && setShowPlans(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-5 h-5 text-primary" /> Choose Your Plan
            </DialogTitle>
            <DialogDescription>Unlock unlimited access to all features</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="rounded-xl border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => { setSelectedPlan(plan); }}
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
                <Button variant="hero" size="sm" className="w-full mt-3" onClick={() => setSelectedPlan(plan)}>
                  <IndianRupee className="w-3.5 h-3.5 mr-1" /> Select {plan.name}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => { if (!open) { setSelectedPlan(null); setShowPlans(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <QrCode className="w-5 h-5 text-primary" /> Pay for {selectedPlan?.name} Plan
            </DialogTitle>
            <DialogDescription>
              Scan the QR code or copy the UPI ID to pay <span className="font-semibold text-foreground">{selectedPlan?.price}{selectedPlan?.period}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <img src={qrCodeUrl} alt="UPI QR Code" width={220} height={220} className="rounded-lg" />
            </div>
            <div className="w-full flex items-center gap-2 bg-muted rounded-lg px-4 py-3">
              <span className="text-sm text-muted-foreground">UPI ID:</span>
              <span className="font-mono font-semibold text-foreground flex-1">{UPI_ID}</span>
              <Button variant="ghost" size="icon" onClick={copyUpiId} className="shrink-0">
                {copied ? <CheckCircle className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </Button>
            </div>
            <a href={upiPaymentLink} className="w-full">
              <Button variant="hero" className="w-full">
                <IndianRupee className="w-4 h-4 mr-1" /> Pay {selectedPlan?.price} via UPI App
              </Button>
            </a>
            <div className="w-full border-t border-border pt-4 space-y-3">
              <p className="text-sm font-semibold text-card-foreground text-center">After payment, submit your transaction ID:</p>
              <Input
                placeholder="Enter UPI Transaction ID"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaywallBanner;
