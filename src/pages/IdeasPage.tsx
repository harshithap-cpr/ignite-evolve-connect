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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Lightbulb, Plus, TrendingUp, Eye, EyeOff, FileText, Shield, Gem, Swords, Target, Users, Star, AlertTriangle, ArrowRight, CheckCircle2, Presentation, Copy, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import TRLTracker from "@/components/TRLTracker";

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
  feedback: string | null;
}

const stageTRL: Record<string, number> = {
  ideation: 1,
  validation: 3,
  prototype: 5,
  mvp: 7,
  growth: 9,
};

const trlToStage = (trl: number): string => {
  if (trl <= 2) return "ideation";
  if (trl <= 4) return "validation";
  if (trl <= 6) return "prototype";
  if (trl <= 8) return "mvp";
  return "growth";
};

const IdeasPage = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [publicIdeas, setPublicIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [detailIdea, setDetailIdea] = useState<Idea | null>(null);
  const [tab, setTab] = useState<"my" | "leaderboard">("my");
  const [formData, setFormData] = useState({
    title: "", problem_statement: "", proposed_solution: "", target_audience: "",
    unique_value: "", market_size: "", tags: "", is_public: false,
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchIdeas = async () => {
    if (user) {
      const { data } = await supabase.from("ideas").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (data) setIdeas(data as Idea[]);
    }
    const { data: pub } = await supabase.from("ideas").select("*").eq("is_public", true).order("overall_score", { ascending: false }).limit(20);
    if (pub) setPublicIdeas(pub as Idea[]);
    setLoading(false);
  };

  useEffect(() => { fetchIdeas(); }, [user]);

  // Realtime: refresh ideas when any idea changes
  useRealtime({
    table: "ideas",
    onInsert: () => fetchIdeas(),
    onUpdate: () => fetchIdeas(),
    onDelete: () => fetchIdeas(),
  });

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
    if (!user) { toast.error("Please sign in first"); navigate("/auth"); return; }
    const scores = calculateScores(formData);
    const { error } = await supabase.from("ideas").insert({
      user_id: user.id, title: formData.title, problem_statement: formData.problem_statement,
      proposed_solution: formData.proposed_solution, target_audience: formData.target_audience,
      unique_value: formData.unique_value, market_size: formData.market_size,
      tags: formData.tags.split(",").map((s) => s.trim()).filter(Boolean),
      is_public: formData.is_public, ...scores,
    });
    if (error) toast.error("Failed to submit idea");
    else {
      toast.success("Idea submitted and scored! 🎯");
      setShowForm(false);
      setFormData({ title: "", problem_statement: "", proposed_solution: "", target_audience: "", unique_value: "", market_size: "", tags: "", is_public: false });
      fetchIdeas();
    }
  };

  const updateTRL = async (ideaId: string, trl: number) => {
    const stage = trlToStage(trl);
    const { error } = await supabase.from("ideas").update({ stage }).eq("id", ideaId);
    if (error) toast.error("Failed to update");
    else { toast.success(`Updated to TRL ${trl}!`); fetchIdeas(); }
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
              <p className="text-muted-foreground text-lg">Submit ideas, get scored, track your TRL stage.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="hero" onClick={() => navigate("/submit-idea")}>
                <Lightbulb className="w-4 h-4 mr-1" /> AI Analyze
              </Button>
              <Button variant="outline" onClick={() => { if (!user) { navigate("/auth"); return; } setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Quick Submit
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-8">
            <Button variant={tab === "my" ? "default" : "outline"} onClick={() => setTab("my")}>My Ideas</Button>
            <Button variant={tab === "leaderboard" ? "default" : "outline"} onClick={() => setTab("leaderboard")}>
              <TrendingUp className="w-4 h-4 mr-1" /> Leaderboard
            </Button>
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
                <Button variant="hero" onClick={() => navigate("/submit-idea")}>Analyze Your First Idea</Button>
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
                      <div className="text-center">
                        <div className="text-3xl font-bold font-display text-gradient-warm">{idea.overall_score}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="space-y-2 mb-4">
                      <ScoreBar label="Innovation" score={idea.innovation_score} color="bg-primary" />
                      <ScoreBar label="Feasibility" score={idea.feasibility_score} color="bg-spark-teal" />
                      <ScoreBar label="Market" score={idea.market_score} color="bg-spark-amber" />
                    </div>

                    {/* TRL Tracker */}
                    <TRLTracker
                      currentLevel={stageTRL[idea.stage] || 1}
                      onLevelChange={(trl) => updateTRL(idea.id, trl)}
                      compact
                    />

                    {/* Actions */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedIdea(idea)}>
                        View Full TRL Scale →
                      </Button>
                      {idea.feedback && (
                        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setDetailIdea(idea)}>
                          <FileText className="w-3 h-3" /> View Full Analysis
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate("/pitch-deck", {
                        state: { title: idea.title, problemStatement: idea.problem_statement, proposedSolution: idea.proposed_solution, analysis: idea.feedback ? (() => { try { const f = JSON.parse(idea.feedback); return { ...f, innovation_score: idea.innovation_score, feasibility_score: idea.feasibility_score, market_score: idea.market_score, overall_score: idea.overall_score, market_value: idea.market_size, verdict: idea.unique_value }; } catch { return null; } })() : null }
                      })}>
                        <Presentation className="w-3 h-3" /> Pitch Deck
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {publicIdeas.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">No public ideas yet.</div>
              ) : publicIdeas.map((idea, idx) => (
                <motion.div key={idea.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-display text-sm ${
                    idx === 0 ? "bg-spark-amber/20 text-spark-amber" : idx === 1 ? "bg-muted text-muted-foreground" : idx === 2 ? "bg-spark-coral/20 text-spark-coral" : "bg-muted text-muted-foreground"
                  }`}>#{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-card-foreground truncate">{idea.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{idea.problem_statement}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">TRL {stageTRL[idea.stage] || 1}</Badge>
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

      {/* TRL Full View Dialog */}
      <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedIdea?.title} — TRL Scale</DialogTitle>
            <DialogDescription>Click a level to update your technology readiness stage.</DialogDescription>
          </DialogHeader>
          {selectedIdea && (
            <TRLTracker
              currentLevel={stageTRL[selectedIdea.stage] || 1}
              onLevelChange={(trl) => { updateTRL(selectedIdea.id, trl); setSelectedIdea(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Submit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Quick Submit Idea</DialogTitle>
            <DialogDescription>For AI-powered analysis, use the "AI Analyze" button instead.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div><Label>Idea Title *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="AI-Powered Crop Disease Detector" className="mt-1.5 rounded-xl" required /></div>
            <div><Label>Problem Statement *</Label><Textarea value={formData.problem_statement} onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })} placeholder="What problem does this solve?" className="mt-1.5 rounded-xl" required /></div>
            <div><Label>Proposed Solution *</Label><Textarea value={formData.proposed_solution} onChange={(e) => setFormData({ ...formData, proposed_solution: e.target.value })} placeholder="How does your solution work?" className="mt-1.5 rounded-xl" required /></div>
            <div><Label>Target Audience</Label><Input value={formData.target_audience} onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })} className="mt-1.5 rounded-xl" /></div>
            <div><Label>Tags (comma-separated)</Label><Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="AgriTech, AI" className="mt-1.5 rounded-xl" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_public" checked={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })} className="rounded" />
              <Label htmlFor="is_public" className="text-sm">Make public</Label>
            </div>
            <Button variant="hero" type="submit" className="w-full">Submit & Score</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Full Analysis Dialog */}
      <Dialog open={!!detailIdea} onOpenChange={() => setDetailIdea(null)}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{detailIdea?.title} — Full Analysis</DialogTitle>
            <DialogDescription>Complete AI-generated analysis saved for your idea.</DialogDescription>
          </DialogHeader>
          {detailIdea && (() => {
            let feedback: any = null;
            try { feedback = JSON.parse(detailIdea.feedback || ""); } catch {}
            if (!feedback) return <p className="text-muted-foreground text-sm">No detailed analysis data saved for this idea.</p>;
            return (
              <div className="space-y-5 mt-2">
                {/* Scores */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-1"><Star className="w-4 h-4 text-primary" /> Scores</h4>
                  {[
                    { label: "Innovation", score: detailIdea.innovation_score, color: "bg-primary" },
                    { label: "Feasibility", score: detailIdea.feasibility_score, color: "bg-spark-teal" },
                    { label: "Market", score: detailIdea.market_score, color: "bg-spark-amber" },
                    ...(feedback.ethical_score ? [{ label: "Ethics", score: feedback.ethical_score, color: "bg-emerald-500" }] : []),
                    ...(feedback.novelty_score ? [{ label: "Novelty", score: feedback.novelty_score, color: "bg-violet-500" }] : []),
                    { label: "Overall", score: detailIdea.overall_score, color: "bg-gradient-warm" },
                  ].map(s => <ScoreBar key={s.label} {...s} />)}
                </div>

                {/* Market Info */}
                {detailIdea.market_size && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1 mb-2"><TrendingUp className="w-4 h-4 text-spark-teal" /> Market</h4>
                    <p className="text-sm text-muted-foreground">TAM: <span className="font-bold text-foreground">{detailIdea.market_size}</span></p>
                    <p className="text-sm text-muted-foreground mt-1">Verdict: {detailIdea.unique_value}</p>
                  </div>
                )}

                {/* Ethical Analysis */}
                {feedback.ethical_analysis && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1 mb-2"><Shield className="w-4 h-4 text-emerald-500" /> Ethical Analysis</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(feedback.ethical_analysis).filter(([k]) => k !== "risk_level").map(([key, val]) => (
                        <div key={key} className="p-2 bg-secondary/50 rounded-lg">
                          <p className="text-xs font-bold text-muted-foreground uppercase">{key.replace(/_/g, " ")}</p>
                          <p className="text-xs text-foreground mt-0.5">{val as string}</p>
                        </div>
                      ))}
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">{feedback.ethical_analysis.risk_level} Risk</Badge>
                  </div>
                )}

                {/* Novelty Analysis */}
                {feedback.novelty_analysis && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1 mb-2"><Gem className="w-4 h-4 text-violet-500" /> Novelty & Originality</h4>
                    <div className="space-y-2">
                      {Object.entries(feedback.novelty_analysis).filter(([k]) => k !== "patentability").map(([key, val]) => (
                        <div key={key} className="p-2 bg-secondary/50 rounded-lg">
                          <p className="text-xs font-bold text-muted-foreground uppercase">{key.replace(/_/g, " ")}</p>
                          <p className="text-xs text-foreground mt-0.5">{val as string}</p>
                        </div>
                      ))}
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">{feedback.novelty_analysis.patentability} Patentability</Badge>
                  </div>
                )}

                {/* Competitors */}
                {feedback.competing_apps && (
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1 mb-2"><Swords className="w-4 h-4 text-spark-amber" /> Competitors</h4>
                    {feedback.competing_apps.map((c: any, i: number) => (
                      <div key={i} className="p-2 bg-secondary/50 rounded-lg mb-1.5">
                        <p className="text-xs font-bold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                        <p className="text-xs text-spark-amber">⚡ {c.weakness}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-2 gap-3">
                  {feedback.strengths && (
                    <div>
                      <h4 className="font-semibold text-xs text-foreground flex items-center gap-1 mb-1"><CheckCircle2 className="w-3 h-3 text-spark-teal" /> Strengths</h4>
                      {feedback.strengths.map((s: string, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-spark-teal">•</span> {s}</p>
                      ))}
                    </div>
                  )}
                  {feedback.improvements && (
                    <div>
                      <h4 className="font-semibold text-xs text-foreground flex items-center gap-1 mb-1"><AlertTriangle className="w-3 h-3 text-spark-amber" /> Improvements</h4>
                      {feedback.improvements.map((s: string, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-spark-amber">•</span> {s}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="hero" size="sm" className="flex-1 gap-1" onClick={() => {
                    setDetailIdea(null);
                    navigate("/pitch-deck", {
                      state: { title: detailIdea.title, problemStatement: detailIdea.problem_statement, proposedSolution: detailIdea.proposed_solution, analysis: { ...feedback, innovation_score: detailIdea.innovation_score, feasibility_score: detailIdea.feasibility_score, market_score: detailIdea.market_score, overall_score: detailIdea.overall_score, market_value: detailIdea.market_size, verdict: detailIdea.unique_value } }
                    });
                  }}>
                    <Presentation className="w-4 h-4" /> Generate Pitch Deck
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify({ title: detailIdea.title, problem: detailIdea.problem_statement, solution: detailIdea.proposed_solution, scores: { innovation: detailIdea.innovation_score, feasibility: detailIdea.feasibility_score, market: detailIdea.market_score, overall: detailIdea.overall_score }, ...feedback }, null, 2));
                    toast.success("Analysis copied to clipboard!");
                  }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default IdeasPage;
