import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, CheckCircle2, Circle, Clock, AlertCircle, Shield, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUsageGate } from "@/hooks/use-usage-gate";
import PaywallBanner from "@/components/PaywallBanner";
import { format } from "date-fns";

interface Patent {
  id: string;
  title: string;
  description: string;
  invention_type: string;
  stage: string;
  filing_date: string | null;
  application_number: string | null;
  inventors: string[];
  keywords: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

const patentStages = [
  { key: "draft", label: "Draft", icon: FileText, description: "Prepare your patent application" },
  { key: "prior_art_search", label: "Prior Art Search", icon: Clock, description: "Research existing patents" },
  { key: "application_filing", label: "Filing", icon: AlertCircle, description: "Submit to patent office" },
  { key: "examination", label: "Examination", icon: Shield, description: "Under review by examiner" },
  { key: "published", label: "Published", icon: CheckCircle2, description: "Patent application published" },
  { key: "granted", label: "Granted", icon: Award, description: "Patent approved!" },
  { key: "rejected", label: "Rejected", icon: Circle, description: "Application was rejected" },
];

const stageColors: Record<string, string> = {
  draft: "text-muted-foreground",
  prior_art_search: "text-spark-amber",
  application_filing: "text-primary",
  examination: "text-spark-lavender",
  published: "text-spark-teal",
  granted: "text-spark-teal",
  rejected: "text-spark-coral",
};

const PatentsPage = () => {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    invention_type: "utility",
    inventors: "",
    keywords: "",
    notes: "",
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchPatents = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("patents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setPatents(data as Patent[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchPatents();
  }, [user]);

  const { canUse, remainingFree, isPaid, recordUsage } = useUsageGate("patent_filing");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }
    if (!canUse) { toast.error("Free patent filing limit reached. Please upgrade."); return; }

    const { error } = await supabase.from("patents").insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      invention_type: formData.invention_type,
      inventors: formData.inventors.split(",").map((s) => s.trim()).filter(Boolean),
      keywords: formData.keywords.split(",").map((s) => s.trim()).filter(Boolean),
      notes: formData.notes,
    });

    if (error) {
      toast.error("Failed to register patent");
    } else {
      toast.success("Patent registered successfully! 📄");
      setShowForm(false);
      setFormData({ title: "", description: "", invention_type: "utility", inventors: "", keywords: "", notes: "" });
      fetchPatents();
    }
  };

  const updateStage = async (patentId: string, newStage: string) => {
    const updates: Record<string, unknown> = { stage: newStage };
    if (newStage === "application_filing") {
      updates.filing_date = new Date().toISOString();
    }
    const { error } = await supabase.from("patents").update(updates).eq("id", patentId);
    if (error) toast.error("Failed to update stage");
    else {
      toast.success("Stage updated!");
      fetchPatents();
    }
  };

  const currentStageIndex = (stage: string) => patentStages.findIndex((s) => s.key === stage);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-3xl font-bold font-display mb-4">Patent Registration</h1>
          <p className="text-muted-foreground mb-6">Sign in to manage your patent applications</p>
          <Button variant="hero" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-display mb-2">
                Patent <span className="text-gradient-warm">Registration</span>
              </h1>
              <p className="text-muted-foreground text-lg">Track your patent applications from draft to granted.</p>
            </div>
            <Button variant="hero" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Patent
            </Button>
          </div>

          {/* Step-by-step guidance */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-10">
            <h2 className="font-display font-bold text-lg mb-4 text-card-foreground">📋 Patent Filing Guide — Step by Step</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { step: 1, title: "Document Your Invention", desc: "Write a detailed description with diagrams and claims." },
                { step: 2, title: "Prior Art Search", desc: "Search existing patents to ensure novelty of your idea." },
                { step: 3, title: "Draft Application", desc: "Prepare specification, claims, abstract, and drawings." },
                { step: 4, title: "File Application", desc: "Submit to Indian Patent Office (IPO) with Form 1, 2, 3, 5." },
                { step: 5, title: "Examination & Response", desc: "Respond to examiner objections within 12 months." },
                { step: 6, title: "Grant & Renewal", desc: "Once granted, renew annually to maintain protection." },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-warm text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-card-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading patents...</div>
          ) : patents.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="font-display font-bold text-xl mb-2 text-foreground">No Patents Yet</h3>
              <p className="text-muted-foreground mb-6">Start by registering your first patent application.</p>
              <Button variant="hero" onClick={() => setShowForm(true)}>Register Your First Patent</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {patents.map((patent, idx) => {
                const stageIdx = currentStageIndex(patent.stage);
                return (
                  <motion.div
                    key={patent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-card rounded-2xl border border-border p-6 hover:shadow-warm transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold font-display text-lg text-card-foreground">{patent.title}</h3>
                          <Badge variant="secondary" className="capitalize">{patent.invention_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{patent.description}</p>
                        {patent.application_number && (
                          <p className="text-xs text-muted-foreground mt-1">Application #: {patent.application_number}</p>
                        )}
                        {patent.filing_date && (
                          <p className="text-xs text-muted-foreground">Filed: {format(new Date(patent.filing_date), "MMM d, yyyy")}</p>
                        )}
                      </div>
                      <Select value={patent.stage} onValueChange={(val) => updateStage(patent.id, val)}>
                        <SelectTrigger className="w-48 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {patentStages.map((s) => (
                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Stage progress */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                      {patentStages.filter((s) => s.key !== "rejected").map((stage, i) => {
                        const isCompleted = i < stageIdx;
                        const isCurrent = i === stageIdx;
                        const isRejected = patent.stage === "rejected";
                        return (
                          <div key={stage.key} className="flex items-center">
                            <div className={`flex flex-col items-center min-w-[80px] ${i > 0 ? "" : ""}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                isRejected && isCurrent ? "bg-spark-coral/20 text-spark-coral" :
                                isCompleted ? "bg-spark-teal/20 text-spark-teal" :
                                isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <stage.icon className="w-4 h-4" />}
                              </div>
                              <span className={`text-[10px] mt-1 text-center ${isCurrent ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                                {stage.label}
                              </span>
                            </div>
                            {i < patentStages.length - 2 && (
                              <div className={`w-6 h-0.5 ${isCompleted ? "bg-spark-teal" : "bg-border"} mt-[-12px]`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Register New Patent</DialogTitle>
            <DialogDescription>Fill in your invention details to start tracking.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label>Invention Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Smart Water Purification System" className="mt-1.5 rounded-xl" required />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your invention in detail..." className="mt-1.5 rounded-xl" required />
            </div>
            <div>
              <Label>Invention Type</Label>
              <Select value={formData.invention_type} onValueChange={(val) => setFormData({ ...formData, invention_type: val })}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="utility">Utility Patent</SelectItem>
                  <SelectItem value="design">Design Patent</SelectItem>
                  <SelectItem value="plant">Plant Patent</SelectItem>
                  <SelectItem value="provisional">Provisional Patent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Inventors (comma-separated)</Label>
              <Input value={formData.inventors} onChange={(e) => setFormData({ ...formData, inventors: e.target.value })} placeholder="John Doe, Jane Smith" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Keywords (comma-separated)</Label>
              <Input value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} placeholder="IoT, water, purification" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any additional notes..." className="mt-1.5 rounded-xl" />
            </div>
            <Button variant="hero" type="submit" className="w-full">Register Patent</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PatentsPage;
