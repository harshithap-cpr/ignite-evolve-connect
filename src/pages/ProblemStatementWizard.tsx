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
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Target,
  Puzzle,
  Users,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface WizardData {
  title: string;
  problem_statement: string;
  who_affected: string;
  current_solutions: string;
  proposed_solution: string;
  how_it_works: string;
  target_audience: string;
  unique_value: string;
  market_size: string;
  tags: string;
  is_public: boolean;
}

const steps = [
  { key: "problem", label: "Define Problem", icon: Lightbulb, emoji: "💡" },
  { key: "solution", label: "Your Solution", icon: Puzzle, emoji: "🔧" },
  { key: "market", label: "Market & Audience", icon: Target, emoji: "🎯" },
  { key: "unique", label: "Unique Value", icon: Sparkles, emoji: "✨" },
  { key: "review", label: "Review & Submit", icon: CheckCircle2, emoji: "🚀" },
];

const ProblemStatementWizard = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    title: "",
    problem_statement: "",
    who_affected: "",
    current_solutions: "",
    proposed_solution: "",
    how_it_works: "",
    target_audience: "",
    unique_value: "",
    market_size: "",
    tags: "",
    is_public: true,
  });
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState({ innovation: 0, feasibility: 0, market: 0, overall: 0 });
  const { user } = useAuth();
  const navigate = useNavigate();

  const update = (field: keyof WizardData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateScores = () => {
    let innovation = 0, feasibility = 0, market = 0;
    if (data.problem_statement.length > 50) innovation += 2;
    if (data.problem_statement.length > 150) innovation += 1;
    if (data.proposed_solution.length > 50) innovation += 2;
    if (data.how_it_works.length > 30) innovation += 2;
    if (data.unique_value.length > 30) innovation += 3;

    if (data.target_audience.length > 20) feasibility += 3;
    if (data.proposed_solution.length > 100) feasibility += 2;
    if (data.how_it_works.length > 50) feasibility += 3;
    if (data.tags.split(",").length >= 2) feasibility += 2;

    if (data.market_size.length > 10) market += 4;
    if (data.target_audience.length > 30) market += 2;
    if (data.who_affected.length > 20) market += 2;
    if (data.current_solutions.length > 20) market += 2;

    return {
      innovation: Math.min(innovation, 10),
      feasibility: Math.min(feasibility, 10),
      market: Math.min(market, 10),
      overall: Math.min(Math.round((innovation + feasibility + market) / 3), 10),
    };
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.title.length > 0 && data.problem_statement.length > 0;
      case 1: return data.proposed_solution.length > 0;
      case 2: return data.target_audience.length > 0;
      case 3: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }

    const s = calculateScores();
    setScores(s);

    const fullProblem = `${data.problem_statement}\n\nWho is affected: ${data.who_affected}\n\nCurrent solutions: ${data.current_solutions}`;

    const { error } = await supabase.from("ideas").insert({
      user_id: user.id,
      title: data.title,
      problem_statement: fullProblem,
      proposed_solution: `${data.proposed_solution}\n\nHow it works: ${data.how_it_works}`,
      target_audience: data.target_audience,
      unique_value: data.unique_value,
      market_size: data.market_size,
      tags: data.tags.split(",").map((s) => s.trim()).filter(Boolean),
      is_public: data.is_public,
      innovation_score: s.innovation,
      feasibility_score: s.feasibility,
      market_score: s.market,
      overall_score: s.overall,
    });

    if (error) {
      toast.error("Submission failed. Try again.");
    } else {
      setSubmitted(true);
      toast.success("Idea submitted successfully! 🎉");
    }
  };

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

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl border border-border p-8 text-center"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold font-display mb-2 text-foreground">Idea Submitted!</h1>
              <p className="text-muted-foreground mb-8">Here's how your idea scored:</p>

              <div className="space-y-4 mb-8 text-left">
                <ScoreBar label="Innovation" score={scores.innovation} color="bg-primary" />
                <ScoreBar label="Feasibility" score={scores.feasibility} color="bg-spark-teal" />
                <ScoreBar label="Market" score={scores.market} color="bg-spark-amber" />
                <div className="pt-2 border-t border-border">
                  <ScoreBar label="Overall" score={scores.overall} color="bg-gradient-warm" />
                </div>
              </div>

              <h2 className="font-display font-bold text-lg mb-4 text-foreground">🧭 What to Do Next</h2>
              <div className="space-y-3 text-left mb-8">
                {[
                  { step: "1", title: "Validate Your Problem", desc: "Talk to at least 20 potential users to confirm the problem exists", route: "/mentors", cta: "Find a Mentor" },
                  { step: "2", title: "Join a Hackathon", desc: "Build a prototype in a competitive environment with team support", route: "/hackathons", cta: "Browse Hackathons" },
                  { step: "3", title: "Take Relevant Courses", desc: "Upskill in areas that strengthen your solution", route: "/courses", cta: "Explore Courses" },
                  { step: "4", title: "Protect Your IP", desc: "If your solution is novel, consider filing a patent", route: "/patents", cta: "Register Patent" },
                  { step: "5", title: "Connect with Investors", desc: "When your MVP is ready, pitch to investors for funding", route: "/investors", cta: "Find Investors" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 p-3 bg-secondary/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-warm text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 self-center" onClick={() => navigate(item.route)}>
                      {item.cta}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="hero" className="flex-1" onClick={() => navigate("/ideas")}>
                  View My Ideas <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setSubmitted(false); setStep(0); setData({ title: "", problem_statement: "", who_affected: "", current_solutions: "", proposed_solution: "", how_it_works: "", target_audience: "", unique_value: "", market_size: "", tags: "", is_public: true }); }}>
                  Submit Another
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
              Submit Your <span className="text-gradient-warm">Problem Statement</span>
            </h1>
            <p className="text-muted-foreground">We'll guide you step by step and score your idea automatically.</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => i <= step && setStep(i)}
                  className={`flex flex-col items-center transition-all ${i <= step ? "opacity-100" : "opacity-40"}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    i < step ? "bg-spark-teal/20 text-spark-teal" :
                    i === step ? "bg-primary/20 text-primary ring-2 ring-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {i < step ? <CheckCircle2 className="w-5 h-5" /> : s.emoji}
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground hidden sm:block">{s.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-1 ${i < step ? "bg-spark-teal" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 0 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      <h2 className="font-display font-bold text-xl text-card-foreground">Define the Problem</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">A great innovation starts with a clearly defined problem. Be as specific as possible.</p>

                    <div>
                      <Label>Give your idea a title *</Label>
                      <Input value={data.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g., AI-Powered Crop Disease Detector" className="mt-1.5 rounded-xl" />
                    </div>
                    <div>
                      <Label>What problem are you solving? *</Label>
                      <Textarea value={data.problem_statement} onChange={(e) => update("problem_statement", e.target.value)} placeholder="Describe the problem in detail. What pain point exists? Why does it matter?" className="mt-1.5 rounded-xl min-h-[100px]" />
                      <p className="text-xs text-muted-foreground mt-1">💡 Tip: Start with "Many people struggle with..." or "Currently, there is no way to..."</p>
                    </div>
                    <div>
                      <Label>Who is affected by this problem?</Label>
                      <Input value={data.who_affected} onChange={(e) => update("who_affected", e.target.value)} placeholder="e.g., Small-scale farmers in rural India" className="mt-1.5 rounded-xl" />
                    </div>
                    <div>
                      <Label>What existing solutions exist (and why aren't they enough)?</Label>
                      <Textarea value={data.current_solutions} onChange={(e) => update("current_solutions", e.target.value)} placeholder="e.g., Manual inspection by experts — too expensive and slow" className="mt-1.5 rounded-xl" />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Puzzle className="w-5 h-5 text-spark-amber" />
                      <h2 className="font-display font-bold text-xl text-card-foreground">Describe Your Solution</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Now explain how you plan to solve this problem. Don't worry about technical details yet.</p>

                    <div>
                      <Label>What is your proposed solution? *</Label>
                      <Textarea value={data.proposed_solution} onChange={(e) => update("proposed_solution", e.target.value)} placeholder="Describe your solution. What will it do? How will users benefit?" className="mt-1.5 rounded-xl min-h-[120px]" />
                      <p className="text-xs text-muted-foreground mt-1">💡 Tip: Focus on the "what" before the "how"</p>
                    </div>
                    <div>
                      <Label>How does it work (briefly)?</Label>
                      <Textarea value={data.how_it_works} onChange={(e) => update("how_it_works", e.target.value)} placeholder="e.g., Users take a photo of the crop → AI analyzes → Returns diagnosis in 5 seconds" className="mt-1.5 rounded-xl" />
                      <p className="text-xs text-muted-foreground mt-1">💡 Tip: Use simple steps like "Step 1 → Step 2 → Step 3"</p>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-spark-coral" />
                      <h2 className="font-display font-bold text-xl text-card-foreground">Market & Audience</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Understanding your market helps mentors and investors see the potential.</p>

                    <div>
                      <Label>Who is your target audience? *</Label>
                      <Input value={data.target_audience} onChange={(e) => update("target_audience", e.target.value)} placeholder="e.g., 120M smallholder farmers in India" className="mt-1.5 rounded-xl" />
                    </div>
                    <div>
                      <Label>Estimated market size</Label>
                      <Input value={data.market_size} onChange={(e) => update("market_size", e.target.value)} placeholder="e.g., ₹5,000 Cr addressable market in India" className="mt-1.5 rounded-xl" />
                      <p className="text-xs text-muted-foreground mt-1">💡 Tip: Google "market size [your industry] India" for estimates</p>
                    </div>
                    <div>
                      <Label>Tags (comma-separated)</Label>
                      <Input value={data.tags} onChange={(e) => update("tags", e.target.value)} placeholder="AgriTech, AI, Mobile, Rural" className="mt-1.5 rounded-xl" />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-spark-lavender" />
                      <h2 className="font-display font-bold text-xl text-card-foreground">What Makes You Unique?</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">This is your competitive edge. Why will people choose your solution over alternatives?</p>

                    <div>
                      <Label>Unique Value Proposition</Label>
                      <Textarea value={data.unique_value} onChange={(e) => update("unique_value", e.target.value)} placeholder="e.g., First offline-capable AI crop disease detection that works without internet in rural areas with 95% accuracy" className="mt-1.5 rounded-xl min-h-[100px]" />
                      <p className="text-xs text-muted-foreground mt-1">💡 Tip: Complete this sentence: "Unlike [alternatives], our solution..."</p>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl">
                      <input type="checkbox" id="is_public" checked={data.is_public} onChange={(e) => update("is_public", e.target.checked)} className="rounded" />
                      <Label htmlFor="is_public" className="text-sm cursor-pointer">
                        Make this idea public (visible on leaderboard for community voting)
                      </Label>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-spark-teal" />
                      <h2 className="font-display font-bold text-xl text-card-foreground">Review & Submit</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Review your submission before we score it.</p>

                    <div className="space-y-3">
                      {[
                        { label: "Title", value: data.title },
                        { label: "Problem", value: data.problem_statement },
                        { label: "Affected", value: data.who_affected },
                        { label: "Solution", value: data.proposed_solution },
                        { label: "How it works", value: data.how_it_works },
                        { label: "Audience", value: data.target_audience },
                        { label: "Market Size", value: data.market_size },
                        { label: "Unique Value", value: data.unique_value },
                      ].filter((item) => item.value).map((item) => (
                        <div key={item.label} className="p-3 bg-secondary/30 rounded-xl">
                          <span className="text-xs font-bold text-muted-foreground uppercase">{item.label}</span>
                          <p className="text-sm text-card-foreground mt-0.5 line-clamp-3">{item.value}</p>
                        </div>
                      ))}
                      {data.tags && (
                        <div className="flex flex-wrap gap-1.5">
                          {data.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {!user && (
                      <div className="p-4 bg-spark-amber/10 rounded-xl text-sm text-spark-amber">
                        ⚠️ You need to sign in before submitting. Your data will be saved.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
              <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              {step < steps.length - 1 ? (
                <Button variant="hero" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  Next Step <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button variant="hero" onClick={handleSubmit}>
                  <TrendingUp className="w-4 h-4 mr-1" /> Score & Submit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProblemStatementWizard;
