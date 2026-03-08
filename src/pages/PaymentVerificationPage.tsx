import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle, Clock, XCircle, IndianRupee, FileImage } from "lucide-react";

const PaymentVerificationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchSubs = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSubscriptions(data || []);
      setLoading(false);
    };
    fetchSubs();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in first"); navigate("/auth"); return; }
    if (!transactionId.trim()) { toast.error("Please enter your transaction ID"); return; }

    setSubmitting(true);
    let screenshotUrl = null;

    if (screenshot) {
      const filePath = `${user.id}/${Date.now()}-${screenshot.name}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(filePath, screenshot);
      if (uploadError) {
        toast.error("Failed to upload screenshot");
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(filePath);
      screenshotUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan: "pro",
      status: "pending",
      transaction_id: transactionId.trim(),
      payment_screenshot_url: screenshotUrl,
      amount: 99,
    });

    if (error) {
      toast.error("Failed to submit. Please try again.");
    } else {
      toast.success("Payment submitted for verification! We'll activate your plan within 24 hours.");
      setTransactionId("");
      setScreenshot(null);
      // Refresh subscriptions
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSubscriptions(data || []);
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending Verification</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Please sign in to verify your payment.</p>
          <Button variant="hero" className="mt-4" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Payment Verification</h1>
          <p className="text-muted-foreground mb-8">Submit your UPI transaction details to activate your subscription.</p>

          {/* Submit Form */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4 mb-8">
            <h2 className="font-display font-bold text-lg text-card-foreground flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" /> Submit Payment Proof
            </h2>
            <div className="space-y-2">
              <Label htmlFor="txn-id">UPI Transaction ID / Reference Number</Label>
              <Input
                id="txn-id"
                placeholder="e.g. 412345678901"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="screenshot">Payment Screenshot (optional)</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="screenshot"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted cursor-pointer hover:bg-muted/80 transition-colors text-sm text-muted-foreground"
                >
                  <FileImage className="w-4 h-4" />
                  {screenshot ? screenshot.name : "Choose file"}
                </label>
                <input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={submitting}>
              <Upload className="w-4 h-4 mr-2" />
              {submitting ? "Submitting..." : "Submit for Verification"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Your subscription will be activated within 24 hours after payment verification.
            </p>
          </div>

          {/* Submission History */}
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-card-foreground">Your Submissions</h2>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : subscriptions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No submissions yet.</p>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-card-foreground capitalize">{sub.plan} Plan</span>
                      {statusBadge(sub.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Transaction: {sub.transaction_id || "N/A"} • {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-bold text-card-foreground">₹{sub.amount || 0}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentVerificationPage;
