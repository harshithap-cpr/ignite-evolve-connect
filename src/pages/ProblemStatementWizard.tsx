import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Lightbulb,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  Users,
  Swords,
  Star,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Analysis {
  market_value: string;
  market_growth: string;
  target_customers: { segment: string; size: string; pain_level: string }[];
  competing_apps: { name: string; description: string; weakness: string }[];
  innovation_score: number;
  feasibility_score: number;
  market_score: number;
  overall_score: number;
  strengths: string[];
  improvements: string[];
  verdict: string;
}

const ScoreBar = ({ label, score, color }: { label: string; score: number; color: string }) => (
  <div className="flex items-center gap-3">
    <span className="w-24 text-sm text-muted-foreground">{label}</span>
    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score * 10}%` }}
        transition={{ duration: 1, delay: 0.3 }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
    <span className="font-bold text-foreground w-8 text-right">{score}/10</span>
  </div>
);

const ProblemStatementWizard = () => {
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [proposedSolution, setProposedSolution] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const canSubmit = title.length > 0 && problemStatement.length > 10 && proposedSolution.length > 10;

  const handleAnalyze = async () => {
    if (!canSubmit) return;

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-idea", {
        body: { problem_statement: problemStatement, proposed_solution: proposedSolution },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalysis(data as Analysis);
      toast.success("Analysis complete! 🎯");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }
    if (!analysis) return;

    const { error } = await supabase.from("ideas").insert({
      user_id: user.id,
      title,
      problem_statement: problemStatement,
      proposed_solution: proposedSolution,
      target_audience: analysis.target_customers.map((c) => c.segment).join(", "),
      market_size: analysis.market_value,
      unique_value: analysis.verdict,
      innovation_score: analysis.innovation_score,
      feasibility_score: analysis.feasibility_score,
      market_score: analysis.market_score,
      overall_score: analysis.overall_score,
      feedback: JSON.stringify({ strengths: analysis.strengths, improvements: analysis.improvements, competing_apps: analysis.competing_apps }),
      is_public: true,
      tags: [],
    });

    if (error) {
      toast.error("Failed to save. Try again.");
    } else {
      setSaved(true);
      toast.success("Idea saved successfully! 🎉");
    }
  };

  const handleReset = () => {
    setTitle("");
    setProblemStatement("");
    setProposedSolution("");
    setAnalysis(null);
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
              AI-Powered <span className="text-gradient-warm">Idea Analyzer</span>
            </h1>
            <p className="text-muted-foreground">
              Just enter your problem & solution — our AI will analyze market value, competitors, target customers, and score your idea.
            </p>
          </div>

          {/* Input Form */}
          {!analysis && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-xl text-card-foreground">Tell Us Your Idea</h2>
              </div>

              <div>
                <Label>Give your idea a title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., AI-Powered Crop Disease Detector" className="mt-1.5 rounded-xl" />
              </div>

              <div>
                <Label>What problem are you solving? *</Label>
                <Textarea
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Describe the problem in detail. What pain point exists? Why does it matter? Who is affected?"
                  className="mt-1.5 rounded-xl min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">💡 Tip: Be specific about who faces this problem and why current solutions fail.</p>
              </div>

              <div>
                <Label>What is your proposed solution? *</Label>
                <Textarea
                  value={proposedSolution}
                  onChange={(e) => setProposedSolution(e.target.value)}
                  placeholder="Describe your solution. What will it do? How will users benefit? How does it work?"
                  className="mt-1.5 rounded-xl min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">💡 Tip: Focus on what makes your approach different and better.</p>
              </div>

              <Button variant="hero" size="lg" className="w-full" onClick={handleAnalyze} disabled={!canSubmit}>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze My Idea with AI
              </Button>

              {!user && (
                <div className="p-3 bg-spark-amber/10 rounded-xl text-sm text-spark-amber text-center">
                  ⚠️ Sign in to save your analysis. You can still analyze without signing in.
                </div>
              )}
            </motion.div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl border border-border p-12 text-center"
            >
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl text-card-foreground mb-2">Analyzing Your Idea...</h2>
              <p className="text-muted-foreground text-sm">Our AI is evaluating market potential, identifying competitors, and scoring your idea.</p>
              <div className="flex justify-center gap-2 mt-6">
                {["Market Research", "Competitor Analysis", "Scoring"].map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                  >
                    <Badge variant="secondary" className="text-xs">{s}</Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Title & Verdict */}
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <h2 className="font-display font-bold text-2xl text-card-foreground mb-1">{title}</h2>
                <p className="text-muted-foreground text-sm mb-4">{analysis.verdict}</p>

                {/* Scores */}
                <div className="space-y-3">
                  <ScoreBar label="Innovation" score={analysis.innovation_score} color="bg-primary" />
                  <ScoreBar label="Feasibility" score={analysis.feasibility_score} color="bg-spark-teal" />
                  <ScoreBar label="Market" score={analysis.market_score} color="bg-spark-amber" />
                  <div className="pt-2 border-t border-border">
                    <ScoreBar label="Overall" score={analysis.overall_score} color="bg-gradient-warm" />
                  </div>
                </div>
              </div>

              {/* Market Value */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-spark-teal" />
                  <h3 className="font-display font-bold text-lg text-card-foreground">Market Opportunity</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-spark-teal/10 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Total Market Value</p>
                    <p className="text-2xl font-bold text-spark-teal mt-1">{analysis.market_value}</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Growth Rate</p>
                    <p className="text-2xl font-bold text-primary mt-1">{analysis.market_growth}</p>
                  </div>
                </div>
              </div>

              {/* Target Customers */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-spark-coral" />
                  <h3 className="font-display font-bold text-lg text-card-foreground">Target Customers</h3>
                </div>
                <div className="space-y-3">
                  {analysis.target_customers.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm text-card-foreground">{c.segment}</p>
                        <p className="text-xs text-muted-foreground">{c.size}</p>
                      </div>
                      <Badge variant={c.pain_level === "High" ? "destructive" : c.pain_level === "Medium" ? "default" : "secondary"}>
                        {c.pain_level} Pain
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competing Apps */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Swords className="w-5 h-5 text-spark-amber" />
                  <h3 className="font-display font-bold text-lg text-card-foreground">Competing Solutions</h3>
                </div>
                <div className="space-y-3">
                  {analysis.competing_apps.map((c, i) => (
                    <div key={i} className="p-3 bg-secondary/50 rounded-xl">
                      <p className="font-semibold text-sm text-card-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                      <p className="text-xs text-spark-amber mt-1">⚡ Weakness: {c.weakness}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-spark-teal" />
                    <h3 className="font-display font-bold text-lg text-card-foreground">Strengths</h3>
                  </div>
                  <div className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-spark-teal shrink-0 mt-0.5" />
                        <span className="text-card-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-spark-amber" />
                    <h3 className="font-display font-bold text-lg text-card-foreground">Improvements</h3>
                  </div>
                  <div className="space-y-2">
                    {analysis.improvements.map((s, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <ArrowRight className="w-4 h-4 text-spark-amber shrink-0 mt-0.5" />
                        <span className="text-card-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display font-bold text-lg text-card-foreground mb-4">🧭 What to Do Next</h3>
                <div className="space-y-3">
                  {[
                    { step: "1", title: "Validate Your Problem", desc: "Talk to at least 20 potential users to confirm the problem exists", route: "/mentors", cta: "Find a Mentor" },
                    { step: "2", title: "Join a Hackathon", desc: "Build a prototype in a competitive environment", route: "/hackathons", cta: "Browse Hackathons" },
                    { step: "3", title: "Take Relevant Courses", desc: "Upskill in areas that strengthen your solution", route: "/courses", cta: "Explore Courses" },
                    { step: "4", title: "Protect Your IP", desc: "If your solution is novel, consider filing a patent", route: "/patents", cta: "Register Patent" },
                    { step: "5", title: "Connect with Investors", desc: "When your MVP is ready, pitch to investors", route: "/investors", cta: "Find Investors" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3 p-3 bg-secondary/50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-gradient-warm text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-card-foreground">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 self-center" onClick={() => navigate(item.route)}>
                        {item.cta}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                {!saved ? (
                  <>
                    <Button variant="hero" className="flex-1" onClick={handleSave}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Save to My Ideas
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleReset}>
                      Analyze Another Idea
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="hero" className="flex-1" onClick={() => navigate("/ideas")}>
                      View My Ideas <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={handleReset}>
                      Analyze Another
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProblemStatementWizard;
