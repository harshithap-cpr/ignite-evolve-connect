import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AdminPaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
      if (data) fetchSubscriptions();
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  const fetchSubscriptions = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    setSubscriptions(data || []);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "active") {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      updates.expires_at = expiresAt.toISOString();
    }
    const { error } = await supabase.from("subscriptions").update(updates).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Subscription ${status === "active" ? "activated" : "rejected"}`);
    fetchSubscriptions();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case "pending": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "rejected": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4 text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have admin privileges.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const pending = subscriptions.filter(s => s.status === "pending");
  const others = subscriptions.filter(s => s.status !== "pending");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" /> Admin: Payment Verification
          </h1>
          <p className="text-muted-foreground mb-8">Review and verify user payment submissions.</p>

          {/* Pending */}
          <h2 className="font-display font-bold text-xl text-foreground mb-4">
            Pending Verifications ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-muted-foreground text-sm mb-8">No pending payments.</p>
          ) : (
            <div className="space-y-3 mb-8">
              {pending.map((sub) => (
                <div key={sub.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-bold text-card-foreground capitalize">{sub.plan} Plan</span>
                        {statusBadge(sub.status)}
                        <span className="font-bold text-card-foreground">₹{sub.amount || 0}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        User: {sub.user_id.slice(0, 8)}... • Txn: <strong>{sub.transaction_id || "N/A"}</strong> • {new Date(sub.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.payment_screenshot_url && (
                        <Button variant="outline" size="sm" onClick={() => setSelectedScreenshot(sub.payment_screenshot_url)}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> Screenshot
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => updateStatus(sub.id, "active")}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => updateStatus(sub.id, "rejected")}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History */}
          <h2 className="font-display font-bold text-xl text-foreground mb-4">All Subscriptions</h2>
          <div className="space-y-3">
            {others.map((sub) => (
              <div key={sub.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-card-foreground capitalize">{sub.plan} Plan</span>
                    {statusBadge(sub.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    User: {sub.user_id.slice(0, 8)}... • ₹{sub.amount || 0} • {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </div>
                {sub.expires_at && (
                  <span className="text-xs text-muted-foreground">
                    Expires: {new Date(sub.expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Screenshot Dialog */}
      <Dialog open={!!selectedScreenshot} onOpenChange={(open) => !open && setSelectedScreenshot(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {selectedScreenshot && (
            <img src={selectedScreenshot} alt="Payment screenshot" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminPaymentsPage;
