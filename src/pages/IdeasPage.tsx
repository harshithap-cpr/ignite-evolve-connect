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
import { Lightbulb, Plus, ThumbsUp, ThumbsDown, TrendingUp, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Idea {
  id: string;
  user_id: string;
  title: string;
  problem_statement: string;
  proposed_solution: string;
  target_audience: string;
  unique_value: string;
  market_size: string;
  stage: string;
  innovation_score: number;
  feasibility_score: number;
  market_score: number;
  overall_score: number;
  is_public: boolean;
  tags: string[];
  created_at: string;
}

const stageSteps = [
  { key: "ideation", label: "💡 Ideation", guidance: "Define your problem clearly. Who has this problem? How big is the market?" },
  { key: "validation", label: "✅ Validation", guidance: "Talk to 20+ potential users. Validate the problem exists and your solution fits." },
  { key: "prototype", label: "🔧 Prototype", guidance: "Build a minimum viable prototype. Focus on the core value proposition." },
  { key: "mvp", label: "🚀 MVP", guidance: "Launch your Minimum Viable Product. Get real users and collect feedback." },
  { key: "growth", label: "📈 Growth", guidance: "Scale your solution. Optimize metrics, build team, seek funding." },
];

const IdeasPage = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [publicIdeas, setPublicIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"my" | "leaderboard">("my");
  const [formData, setFormData] = useState({
    title: "",
    problem_statement: "",
    proposed_solution: "",
    target_audience: "",
    unique_value: "",
    market_size: "",
    tags: "",
    is_public: false,
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchIdeas = async () => {
    if (user) {
      const { data } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setIdeas(data as Idea[]);
    }
    // Fetch public ideas for leaderboard
    const { data: pub } = await supabase
      .from("ideas")
      .select("*")
      .eq("is_public", true)
      .order("overall_score", { ascending: false })
      .limit(20);
    if (pub) setPublicIdeas(pub as Idea[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchIdeas();
  }, [user]);

  const calculateScores = (data: typeof formData) => {
    let innovation = 0, feasibility = 0, market = 0;
    if (data.problem_statement.length > 50) innovation += 3;
    if (data.proposed_solution.length > 50) innovation += 3;
    if (data.unique_value.length > 30) innovation += 4;
    if (data.target_audience.length > 20) feasibility += 4;
    if (data.proposed_solution.length > 100) feasibility += 3;
    if (data.tags.split(",").length >= 2) feasibility += 3;
    if (data.market_size.length > 10) market += 5;
    if (data.target_audience.length > 30) market += 3;
    if (data.problem_statement.length > 100) market += 2;
    return {
      innovation_score: Math.min(innovation, 10),
      feasibility_score: Math.min(feasibility, 10),
      market_score: Math.min(market, 10),
      overall_score: Math.min(Math.round((innovation + feasibility + market) / 3), 10),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }

    const scores = calculateScores(formData);

    const { error } = await supabase.from("ideas").insert({
      user_id: user.id,
      title: formData.title,
      problem_statement: formData.problem_statement,
      proposed_solution: formData.proposed_solution,
      target_audience: formData.target_audience,
      unique_value: formData.unique_value,
      market_size: formData.market_size,
      tags: formData.tags.split(",").map((s) => s.trim()).filter(Boolean),
      is_public: formData.is_public,
      ...scores,
    });

    if (error) toast.error("Failed to submit idea");
    else {
      toast.success("Idea submitted and scored! 🎯");
      setShowForm(false);
      setFormData({ title: "", problem_statement: "", proposed_solution: "", target_audience: "", unique_value: "", market_size: "", tags: "", is_public: false });
      fetchIdeas();
    }
  };

  const updateStage = async (ideaId: string, stage: string) => {
    const { error } = await supabase.from("ideas").update({ stage }).eq("id", ideaId);
    if (error) toast.error("Failed to update");
    else { toast.success("Stage updated!"); fetchIdeas(); }
  };

  const togglePublic = async (ideaId: string, current: boolean) => {
    const { error } = await supabase.from("ideas").update({ is_public: !current }).eq("id", ideaId);
    if (error) toast.error("Failed to update");
    else { toast.success(!current ? "Idea is now public!" : "Idea set to private"); fetchIdeas(); }
  };

  const ScoreBar = ({ label, score, color }: { label: string; score: number; color: string }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="font-bold text-card-foreground w-6 text-right">{score}</span>
    </div>
  );

  const currentStepIdx = (stage: string) => stageSteps.findIndex((s) => s.key === stage);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-display mb-2">
                Idea <span className="text-gradient-warm">Lab</span>
              </h1>
              <p className="text-muted-foreground text-lg">Submit ideas, get scored, climb the leaderboard.</p>
            </div>
            <Button variant="hero" onClick={() => { if (!user) { navigate("/auth"); return; } setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Submit Idea
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <Button variant={tab === "my" ? "default" : "outline"} onClick={() => setTab("my")}>My Ideas</Button>
            <Button variant={tab === "leaderboard" ? "default" : "outline"} onClick={() => setTab("leaderboard")}>
              <TrendingUp className="w-4 h-4 mr-1" /> Leaderboard
            </Button>
          </div>

          {/* Step-by-step guidance */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="font-display font-bold text-lg mb-4 text-card-foreground">🧭 Innovation Journey — Stage Guide</h2>
            <div className="grid sm:grid-cols-5 gap-4">
              {stageSteps.map((step, i) => (
                <div key={step.key} className="text-center">
                  <div className="text-2xl mb-1">{step.label.split(" ")[0]}</div>
                  <h3 className="font-semibold text-sm text-card-foreground">{step.label.split(" ").slice(1).join(" ")}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1">{step.guidance}</p>
                </div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading...</div>
          ) : tab === "my" ? (
            !user ? (
              <div className="text-center py-20">
                <Lightbulb className="w-16 h-16 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Sign in to submit and track your ideas</p>
                <Button variant="hero" onClick={() => navigate("/auth")}>Sign In</Button>
              </div>
            ) : ideas.length === 0 ? (
              <div className="text-center py-20">
                <Lightbulb className="w-16 h-16 text-muted mx-auto mb-4" />
                <h3 className="font-display font-bold text-xl mb-2 text-foreground">No Ideas Yet</h3>
                <p className="text-muted-foreground mb-6">Submit your first idea and get it scored!</p>
                <Button variant="hero" onClick={() => setShowForm(true)}>Submit Your First Idea</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {ideas.map((idea, idx) => (
                  <motion.div key={idea.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className="bg-card rounded-2xl border border-border p-6 hover:shadow-warm transition-all">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold font-display text-lg text-card-foreground">{idea.title}</h3>
                          <button onClick={() => togglePublic(idea.id, idea.is_public)} className="text-muted-foreground hover:text-foreground">
                            {idea.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{idea.problem_statement}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {idea.tags?.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-3xl font-bold font-display text-gradient-warm">{idea.overall_score}</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <Select value={idea.stage} onValueChange={(val) => updateStage(idea.id, val)}>
                          <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {stageSteps.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Stage progress bar */}
                    <div className="flex gap-1 mb-4">
                      {stageSteps.map((step, i) => (
                        <div key={step.key} className={`h-2 flex-1 rounded-full ${i <= currentStepIdx(idea.stage) ? "bg-gradient-warm" : "bg-muted"}`} />
                      ))}
                    </div>

                    {/* Scores */}
                    <div className="space-y-2">
                      <ScoreBar label="Innovation" score={idea.innovation_score} color="bg-primary" />
                      <ScoreBar label="Feasibility" score={idea.feasibility_score} color="bg-spark-teal" />
                      <ScoreBar label="Market" score={idea.market_score} color="bg-spark-amber" />
                    </div>

                    {/* Guidance for current stage */}
                    <div className="mt-4 p-3 bg-secondary/50 rounded-xl">
                      <p className="text-xs text-secondary-foreground">
                        <span className="font-bold">Next step:</span>{" "}
                        {stageSteps[Math.min(currentStepIdx(idea.stage) + 1, stageSteps.length - 1)]?.guidance}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            /* Leaderboard */
            <div className="space-y-4">
              {publicIdeas.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">No public ideas yet. Be the first to share!</div>
              ) : publicIdeas.map((idea, idx) => (
                <motion.div key={idea.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-display text-sm ${
                    idx === 0 ? "bg-spark-amber/20 text-spark-amber" :
                    idx === 1 ? "bg-muted text-muted-foreground" :
                    idx === 2 ? "bg-spark-coral/20 text-spark-coral" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-card-foreground truncate">{idea.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{idea.problem_statement}</p>
                  </div>
                  <div className="flex gap-1">
                    {idea.tags?.slice(0, 2).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-display text-gradient-warm">{idea.overall_score}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{idea.stage}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Submit Your Idea</DialogTitle>
            <DialogDescription>Fill in the details — your idea will be scored automatically based on completeness.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label>Idea Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="AI-Powered Crop Disease Detector" className="mt-1.5 rounded-xl" required />
            </div>
            <div>
              <Label>Problem Statement *</Label>
              <Textarea value={formData.problem_statement} onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })} placeholder="What problem does this solve? Who faces it?" className="mt-1.5 rounded-xl" required />
            </div>
            <div>
              <Label>Proposed Solution *</Label>
              <Textarea value={formData.proposed_solution} onChange={(e) => setFormData({ ...formData, proposed_solution: e.target.value })} placeholder="How does your solution work?" className="mt-1.5 rounded-xl" required />
            </div>
            <div>
              <Label>Target Audience</Label>
              <Input value={formData.target_audience} onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })} placeholder="Small-scale farmers in India" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Unique Value Proposition</Label>
              <Input value={formData.unique_value} onChange={(e) => setFormData({ ...formData, unique_value: e.target.value })} placeholder="What makes this different from existing solutions?" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Market Size</Label>
              <Input value={formData.market_size} onChange={(e) => setFormData({ ...formData, market_size: e.target.value })} placeholder="e.g., ₹5000 Cr addressable market" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="AgriTech, AI, Mobile" className="mt-1.5 rounded-xl" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_public" checked={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })} className="rounded" />
              <Label htmlFor="is_public" className="text-sm">Make this idea public (visible on leaderboard)</Label>
            </div>
            <Button variant="hero" type="submit" className="w-full">Submit & Score My Idea</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default IdeasPage;
