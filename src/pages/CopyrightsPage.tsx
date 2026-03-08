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
import { FileText, Plus, CheckCircle2, Circle, Clock, AlertCircle, Shield, Award, Copyright } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface CopyrightEntry {
  id: string;
  title: string;
  description: string | null;
  work_type: string;
  stage: string;
  filing_date: string | null;
  registration_number: string | null;
  authors: string[];
  keywords: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const copyrightStages = [
  { key: "draft", label: "Draft", icon: FileText, description: "Prepare your copyright application" },
  { key: "documentation", label: "Documentation", icon: Clock, description: "Compile work samples & proof" },
  { key: "filed", label: "Filed", icon: AlertCircle, description: "Application submitted" },
  { key: "under_review", label: "Under Review", icon: Shield, description: "Being reviewed by office" },
  { key: "registered", label: "Registered", icon: Award, description: "Copyright granted!" },
  { key: "rejected", label: "Rejected", icon: Circle, description: "Application rejected" },
];

const workTypes = [
  { value: "literary", label: "Literary Work" },
  { value: "musical", label: "Musical Work" },
  { value: "artistic", label: "Artistic Work" },
  { value: "dramatic", label: "Dramatic Work" },
  { value: "cinematographic", label: "Cinematographic Film" },
  { value: "sound_recording", label: "Sound Recording" },
  { value: "software", label: "Computer Software" },
];

const CopyrightsPage = () => {
  const [copyrights, setCopyrights] = useState<CopyrightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    work_type: "literary",
    authors: "",
    keywords: "",
    notes: "",
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCopyrights = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("copyrights" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setCopyrights(data as any as CopyrightEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchCopyrights();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in first"); navigate("/auth"); return; }

    const { error } = await supabase.from("copyrights" as any).insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description,
      work_type: formData.work_type,
      authors: formData.authors.split(",").map((s) => s.trim()).filter(Boolean),
      keywords: formData.keywords.split(",").map((s) => s.trim()).filter(Boolean),
      notes: formData.notes,
    } as any);

    if (error) {
      toast.error("Failed to register copyright");
    } else {
      toast.success("Copyright registered successfully! ©");
      setShowForm(false);
      setFormData({ title: "", description: "", work_type: "literary", authors: "", keywords: "", notes: "" });
      fetchCopyrights();
    }
  };

  const updateStage = async (id: string, newStage: string) => {
    const updates: Record<string, unknown> = { stage: newStage };
    if (newStage === "filed") updates.filing_date = new Date().toISOString();
    const { error } = await supabase.from("copyrights" as any).update(updates as any).eq("id", id);
    if (error) toast.error("Failed to update stage");
    else { toast.success("Stage updated!"); fetchCopyrights(); }
  };

  const currentStageIndex = (stage: string) => copyrightStages.findIndex((s) => s.key === stage);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-3xl font-bold font-display mb-4">Copyright Registration</h1>
          <p className="text-muted-foreground mb-6">Sign in to manage your copyright applications</p>
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
                Copyright <span className="text-gradient-warm">Registration</span>
              </h1>
              <p className="text-muted-foreground text-lg">Track your copyright applications from draft to registered.</p>
            </div>
            <Button variant="hero" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Copyright
            </Button>
          </div>

          {/* Step-by-step guidance */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-10">
            <h2 className="font-display font-bold text-lg mb-4 text-card-foreground">📋 Copyright Filing Guide — Step by Step</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { step: 1, title: "Identify Your Work", desc: "Determine the type — literary, artistic, musical, software, etc." },
                { step: 2, title: "Compile Documentation", desc: "Gather copies of the work, proof of authorship, and creation dates." },
                { step: 3, title: "Prepare Application", desc: "Fill Form XIV (India) or appropriate form with work details." },
                { step: 4, title: "Submit & Pay Fees", desc: "File online at copyright.gov.in or relevant office with prescribed fees." },
                { step: 5, title: "Wait for Examination", desc: "30-day mandatory waiting period for objections, then examination." },
                { step: 6, title: "Receive Certificate", desc: "Upon approval, receive your copyright registration certificate." },
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
            <div className="text-center text-muted-foreground py-20">Loading copyrights...</div>
          ) : copyrights.length === 0 ? (
            <div className="text-center py-20">
              <Copyright className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="font-display font-bold text-xl mb-2 text-foreground">No Copyrights Yet</h3>
              <p className="text-muted-foreground mb-6">Start by registering your first copyright application.</p>
              <Button variant="hero" onClick={() => setShowForm(true)}>Register Your First Copyright</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {copyrights.map((cr, idx) => {
                const stageIdx = currentStageIndex(cr.stage);
                return (
                  <motion.div
                    key={cr.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-card rounded-2xl border border-border p-6 hover:shadow-warm transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold font-display text-lg text-card-foreground">{cr.title}</h3>
                          <Badge variant="secondary" className="capitalize">{cr.work_type.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{cr.description}</p>
                        {cr.registration_number && (
                          <p className="text-xs text-muted-foreground mt-1">Registration #: {cr.registration_number}</p>
                        )}
                        {cr.filing_date && (
                          <p className="text-xs text-muted-foreground">Filed: {format(new Date(cr.filing_date), "MMM d, yyyy")}</p>
                        )}
                      </div>
                      <Select value={cr.stage} onValueChange={(val) => updateStage(cr.id, val)}>
                        <SelectTrigger className="w-48 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {copyrightStages.map((s) => (
                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Stage progress */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                      {copyrightStages.filter((s) => s.key !== "rejected").map((stage, i) => {
                        const isCompleted = i < stageIdx;
                        const isCurrent = i === stageIdx;
                        const isRejected = cr.stage === "rejected";
                        return (
                          <div key={stage.key} className="flex items-center">
                            <div className="flex flex-col items-center min-w-[80px]">
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
                            {i < copyrightStages.length - 2 && (
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
            <DialogTitle className="font-display">Register New Copyright</DialogTitle>
            <DialogDescription>Fill in your work details to start tracking.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label>Work Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="My Novel / Software Application" className="mt-1.5 rounded-xl" required />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your work in detail..." className="mt-1.5 rounded-xl" required />
            </div>
            <div>
              <Label>Work Type</Label>
              <Select value={formData.work_type} onValueChange={(val) => setFormData({ ...formData, work_type: val })}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {workTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Authors (comma-separated)</Label>
              <Input value={formData.authors} onChange={(e) => setFormData({ ...formData, authors: e.target.value })} placeholder="John Doe, Jane Smith" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Keywords (comma-separated)</Label>
              <Input value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} placeholder="novel, fiction, drama" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any additional notes..." className="mt-1.5 rounded-xl" />
            </div>
            <Button variant="hero" type="submit" className="w-full">Register Copyright</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CopyrightsPage;
