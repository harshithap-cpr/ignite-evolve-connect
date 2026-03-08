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
  Shield,
  Fingerprint,
  Leaf,
  Scale,
  Gem,
  FileSearch,
  Award,
  Presentation,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/use-subscription";
import { useUsageGate } from "@/hooks/use-usage-gate";
import { Crown, Lock, Check, Copy, CheckCircle, QrCode, IndianRupee } from "lucide-react";

interface EthicalAnalysis {
  privacy_concern: string;
  social_impact: string;
  fairness: string;
  environmental_impact: string;
  risk_level: "Low" | "Medium" | "High";
}

interface NoveltyAnalysis {
  uniqueness: string;
  prior_art: string;
  differentiator: string;
  patentability: "High" | "Medium" | "Low";
}

interface Analysis {
  market_value: string;
  market_growth: string;
  target_customers: { segment: string; size: string; pain_level: string }[];
  competing_apps: { name: string; description: string; weakness: string }[];
  innovation_score: number;
  feasibility_score: number;
  market_score: number;
  ethical_score: number;
  novelty_score: number;
  overall_score: number;
  ethical_analysis: EthicalAnalysis;
  novelty_analysis: NoveltyAnalysis;
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

const riskColors: Record<string, string> = {
  Low: "bg-spark-teal/10 text-spark-teal border-spark-teal/20",
  Medium: "bg-spark-amber/10 text-spark-amber border-spark-amber/20",
  High: "bg-spark-coral/10 text-spark-coral border-spark-coral/20",
};

const ProblemStatementWizard = () => {
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [proposedSolution, setProposedSolution] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [saved, setSaved] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string; amount: number; period: string; description: string; features: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [txnSubmitting, setTxnSubmitting] = useState(false);

  const UPI_ID = "hp123cpr@oksbi";
  const upgradePlans = [
    { name: "Pro", price: "₹99", amount: 99, period: "/month", description: "For serious innovators", features: ["Unlimited feature access", "Priority mentor booking", "All premium courses", "Team collaboration tools"] },
    { name: "Premium", price: "₹250", amount: 250, period: "/month", description: "Full access + personal guidance", features: ["Everything in Pro", "Personal innovation mentor", "Investor pitch opportunities", "Priority support"] },
  ];
  const copyUpiId = async () => { await navigator.clipboard.writeText(UPI_ID); setCopied(true); toast.success("UPI ID copied!"); setTimeout(() => setCopied(false), 2000); };
  const upiPaymentLink = selectedPlan ? `upi://pay?pa=${UPI_ID}&pn=InnovateSpark&am=${selectedPlan.amount}&cu=INR&tn=${selectedPlan.name}%20Plan%20Subscription` : "";
  const qrCodeUrl = selectedPlan ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPaymentLink)}` : "";
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isPaid, plan, loading: subLoading } = useSubscription();
  const { canUse: canAnalyze, remainingFree } = useUsageGate("ai_analysis");

  const canSubmit = title.length > 0 && problemStatement.length > 10 && proposedSolution.length > 10;

  const handleAnalyze = async () => {
    if (!canSubmit) return;
    if (!canAnalyze) { toast.error("Free analysis limit reached. Please upgrade to continue."); return; }
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-idea", {
        body: { problem_statement: problemStatement, proposed_solution: proposedSolution },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const analysisData = data as Analysis;
      setAnalysis(analysisData);
      // Usage is now recorded server-side in the edge function
      toast.success("Analysis complete! 🎯");

      // Auto-save for logged-in users
      if (user) {
        const { error: saveError } = await supabase.from("ideas").insert({
          user_id: user.id, title, problem_statement: problemStatement, proposed_solution: proposedSolution,
          target_audience: analysisData.target_customers.map((c) => c.segment).join(", "),
          market_size: analysisData.market_value, unique_value: analysisData.verdict,
          innovation_score: analysisData.innovation_score, feasibility_score: analysisData.feasibility_score,
          market_score: analysisData.market_score, overall_score: analysisData.overall_score,
          feedback: JSON.stringify({ strengths: analysisData.strengths, improvements: analysisData.improvements, competing_apps: analysisData.competing_apps, ethical_analysis: analysisData.ethical_analysis, novelty_analysis: analysisData.novelty_analysis, ethical_score: analysisData.ethical_score, novelty_score: analysisData.novelty_score }),
          is_public: true, tags: [],
        });
        if (saveError) {
          console.error("Auto-save failed:", saveError);
        } else {
          setSaved(true);
          toast.success("Idea saved automatically! 🎉");
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!user) { toast.error("Please sign in first"); navigate("/auth"); return; }
    if (!analysis) return;
    const { error } = await supabase.from("ideas").insert({
      user_id: user.id, title, problem_statement: problemStatement, proposed_solution: proposedSolution,
      target_audience: analysis.target_customers.map((c) => c.segment).join(", "),
      market_size: analysis.market_value, unique_value: analysis.verdict,
      innovation_score: analysis.innovation_score, feasibility_score: analysis.feasibility_score,
      market_score: analysis.market_score, overall_score: analysis.overall_score,
      feedback: JSON.stringify({ strengths: analysis.strengths, improvements: analysis.improvements, competing_apps: analysis.competing_apps, ethical_analysis: analysis.ethical_analysis, novelty_analysis: analysis.novelty_analysis, ethical_score: analysis.ethical_score, novelty_score: analysis.novelty_score }),
      is_public: true, tags: [],
    });
    if (error) toast.error("Failed to save. Try again.");
    else { setSaved(true); toast.success("Idea saved successfully! 🎉"); }
  };

  const handleReset = () => { setTitle(""); setProblemStatement(""); setProposedSolution(""); setAnalysis(null); setSaved(false); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
              AI-Powered <span className="text-gradient-warm">Idea Analyzer</span>
            </h1>
            <p className="text-muted-foreground">
              Enter your problem & solution — our AI analyzes market value, competitors, ethics, novelty, and scores your idea.
            </p>
          </div>

          {/* Input Form */}
          {!analysis && !isAnalyzing && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-5">
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
                <Textarea value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="Describe the problem in detail. What pain point exists?" className="mt-1.5 rounded-xl min-h-[120px]" />
                <p className="text-xs text-muted-foreground mt-1">💡 Tip: Be specific about who faces this problem and why current solutions fail.</p>
              </div>
              <div>
                <Label>What is your proposed solution? *</Label>
                <Textarea value={proposedSolution} onChange={(e) => setProposedSolution(e.target.value)} placeholder="Describe your solution. What will it do? How will users benefit?" className="mt-1.5 rounded-xl min-h-[120px]" />
                <p className="text-xs text-muted-foreground mt-1">💡 Tip: Focus on what makes your approach different and better.</p>
              </div>

              {/* Show analyze button if user can still use free or is paid */}
              {(canAnalyze || isPaid) ? (
                <>
                  <Button variant="hero" size="lg" className="w-full" onClick={handleAnalyze} disabled={!canSubmit}>
                    <Sparkles className="w-5 h-5 mr-2" /> Analyze My Idea with AI
                  </Button>
                  {!isPaid && remainingFree > 0 && (
                    <div className="p-3 bg-spark-amber/10 rounded-xl text-sm text-spark-amber text-center border border-spark-amber/20">
                      ⚠️ You have <strong>{remainingFree} free analysis</strong> remaining. Subscribe for unlimited access.
                    </div>
                  )}
                </>
              ) : (
                /* FREE LIMIT REACHED — show plans + payment right here */
                <div className="space-y-5 border-t border-border pt-5">
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Crown className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-card-foreground">
                      Free Analysis Limit Reached
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      You've used your 2 free analyses. Subscribe to continue analyzing ideas and unlock detailed reports.
                    </p>
                  </div>

                  {/* Plan cards */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {upgradePlans.map((p) => (
                      <div
                        key={p.name}
                        className={`rounded-xl border-2 p-4 transition-all cursor-pointer text-left ${
                          selectedPlan?.name === p.name
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedPlan(p)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-display font-bold text-card-foreground">{p.name}</h4>
                            <p className="text-xs text-muted-foreground">{p.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold font-display text-card-foreground">{p.price}</span>
                            <span className="text-xs text-muted-foreground">{p.period}</span>
                          </div>
                        </div>
                        <ul className="space-y-1 mt-2">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-xs text-card-foreground">
                              <Check className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Payment section inline */}
                  {selectedPlan ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-border pt-5 space-y-5"
                    >
                      <h4 className="font-display font-bold text-lg text-card-foreground text-center flex items-center justify-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        Pay {selectedPlan.price}{selectedPlan.period} for {selectedPlan.name}
                      </h4>
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="bg-background border border-border rounded-xl p-4 shadow-sm shrink-0">
                          <img src={qrCodeUrl} alt="UPI QR Code" width={200} height={200} className="rounded-lg" />
                        </div>
                        <div className="flex-1 w-full space-y-4">
                          <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3">
                            <span className="text-sm text-muted-foreground">UPI ID:</span>
                            <span className="font-mono font-semibold text-foreground flex-1">{UPI_ID}</span>
                            <Button variant="ghost" size="icon" onClick={copyUpiId} className="shrink-0">
                              {copied ? <CheckCircle className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </Button>
                          </div>
                          <a href={upiPaymentLink} className="block w-full">
                            <Button variant="hero" className="w-full">
                              <IndianRupee className="w-4 h-4 mr-1" /> Pay {selectedPlan.price} via GPay / PhonePe / Paytm
                            </Button>
                          </a>
                          <p className="text-xs text-muted-foreground text-center">
                            Opens your installed UPI payment app directly. No WhatsApp needed.
                          </p>
                          <div className="border-t border-border pt-4 space-y-3">
                            <p className="text-sm font-semibold text-card-foreground">After payment, enter your transaction ID:</p>
                            <Input placeholder="Enter UPI Transaction ID" value={txnId} onChange={(e) => setTxnId(e.target.value)} />
                            <Button
                              variant="hero"
                              className="w-full"
                              disabled={!txnId.trim() || txnSubmitting}
                              onClick={async () => {
                                if (!user) { toast.error("Please sign in"); return; }
                                setTxnSubmitting(true);
                                const { error } = await supabase.from("subscriptions").insert({
                                  user_id: user.id,
                                  plan: selectedPlan.name.toLowerCase(),
                                  status: "pending",
                                  transaction_id: txnId.trim(),
                                  amount: selectedPlan.amount,
                                });
                                setTxnSubmitting(false);
                                if (error) { toast.error("Failed to submit"); return; }
                                toast.success("Payment submitted! We'll verify & activate within 24 hours.");
                                setSelectedPlan(null);
                                setTxnId("");
                              }}
                            >
                              {txnSubmitting ? "Submitting..." : "Submit for Verification"}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                              Or <a href="/payment-verification" className="text-primary underline">upload screenshot</a> for faster verification.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center animate-pulse">👆 Select a plan above to see payment options</p>
                  )}
                </div>
              )}

              {!canSubmit && (title.length > 0 || problemStatement.length > 0 || proposedSolution.length > 0) && (canAnalyze || isPaid) && (
                <div className="p-3 bg-destructive/10 rounded-xl text-sm text-destructive text-center space-y-1">
                  {title.length === 0 && <p>• Please enter a title for your idea</p>}
                  {problemStatement.length <= 10 && <p>• Problem statement needs at least 10 characters ({problemStatement.length}/10)</p>}
                  {proposedSolution.length <= 10 && <p>• Proposed solution needs at least 10 characters ({proposedSolution.length}/10)</p>}
                </div>
              )}
              {!user && (
                <div className="p-3 bg-spark-amber/10 rounded-xl text-sm text-spark-amber text-center">
                  ⚠️ Sign in to save your analysis and unlock detailed reports with a subscription.
                </div>
              )}
            </motion.div>
          )}

          {/* Loading */}
          {isAnalyzing && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border border-border p-12 text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl text-card-foreground mb-2">Analyzing Your Idea...</h2>
              <p className="text-muted-foreground text-sm">Evaluating market potential, ethics, novelty, and competitors.</p>
              <div className="flex justify-center gap-2 mt-6 flex-wrap">
                {["Market Research", "Competitor Analysis", "Ethical Check", "Novelty Check", "Scoring"].map((s, i) => (
                  <motion.div key={s} initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}>
                    <Badge variant="secondary" className="text-xs">{s}</Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {analysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Basic Scores - visible to all */}
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display font-bold text-2xl text-card-foreground">{title}</h2>
                  {!isPaid && (
                    <Badge variant="secondary" className="text-xs">
                      Basic Report — Upgrade for Full Analysis
                    </Badge>
                  )}
                  {isPaid && (
                    <Badge className="text-xs bg-primary text-primary-foreground">
                      Full Report
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mb-4">{analysis.verdict}</p>
                <div className="space-y-3">
                  <ScoreBar label="Overall" score={analysis.overall_score} color="bg-gradient-warm" />
                  <ScoreBar label="Innovation" score={analysis.innovation_score} color="bg-primary" />
                  <ScoreBar label="Feasibility" score={analysis.feasibility_score} color="bg-spark-teal" />
                </div>
                {!isPaid && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Market score, ethics, novelty, competitors & more available in full report</span>
                  </div>
                )}
              </div>



              {/* Detailed sections - only for paid users */}
              {isPaid && (
                <>
                  {/* Full Scores */}
                  <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                    <h3 className="font-display font-bold text-lg text-card-foreground mb-3">Detailed Scores</h3>
                    <div className="space-y-3">
                      <ScoreBar label="Innovation" score={analysis.innovation_score} color="bg-primary" />
                      <ScoreBar label="Feasibility" score={analysis.feasibility_score} color="bg-spark-teal" />
                      <ScoreBar label="Market" score={analysis.market_score} color="bg-spark-amber" />
                      <ScoreBar label="Ethics" score={analysis.ethical_score} color="bg-emerald-500" />
                      <ScoreBar label="Novelty" score={analysis.novelty_score} color="bg-violet-500" />
                    </div>
                  </div>

                  {/* Ethical Analysis */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-display font-bold text-lg text-card-foreground">Ethical Analysis</h3>
                      <Badge variant="outline" className={riskColors[analysis.ethical_analysis.risk_level]}>
                        {analysis.ethical_analysis.risk_level} Risk
                      </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Fingerprint className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs font-bold text-muted-foreground uppercase">Privacy</p>
                        </div>
                        <p className="text-sm text-card-foreground">{analysis.ethical_analysis.privacy_concern}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs font-bold text-muted-foreground uppercase">Social Impact</p>
                        </div>
                        <p className="text-sm text-card-foreground">{analysis.ethical_analysis.social_impact}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Scale className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs font-bold text-muted-foreground uppercase">Fairness</p>
                        </div>
                        <p className="text-sm text-card-foreground">{analysis.ethical_analysis.fairness}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Leaf className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs font-bold text-muted-foreground uppercase">Environment</p>
                        </div>
                        <p className="text-sm text-card-foreground">{analysis.ethical_analysis.environmental_impact}</p>
                      </div>
                    </div>
                  </div>

                  {/* Novelty Analysis */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Gem className="w-5 h-5 text-violet-500" />
                      <h3 className="font-display font-bold text-lg text-card-foreground">Novelty & Originality</h3>
                      <Badge variant="outline" className={riskColors[analysis.novelty_analysis.patentability === "High" ? "Low" : analysis.novelty_analysis.patentability === "Low" ? "High" : "Medium"]}>
                        {analysis.novelty_analysis.patentability} Patentability
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Award className="w-4 h-4 text-violet-500" />
                          <p className="text-xs font-bold text-muted-foreground uppercase">Uniqueness</p>
                        </div>
                        <p className="text-sm text-card-foreground">{analysis.novelty_analysis.uniqueness}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileSearch className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs font-bold text-muted-foreground uppercase">Prior Art</p>
                        </div>
                        <p className="text-sm text-card-foreground">{analysis.novelty_analysis.prior_art}</p>
                      </div>
                      <div className="p-3 bg-violet-500/10 rounded-xl">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Key Differentiator</p>
                        <p className="text-sm font-medium text-card-foreground">{analysis.novelty_analysis.differentiator}</p>
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
                        { step: "1", title: "Validate Your Problem", desc: "Talk to at least 20 potential users", route: "/mentors", cta: "Find a Mentor" },
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

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="hero"
                      className="flex-1 min-w-[180px]"
                      onClick={() => navigate("/pitch-deck", {
                        state: { title, problemStatement, proposedSolution, analysis },
                      })}
                    >
                      <Presentation className="w-4 h-4 mr-1" /> Generate Pitch Deck
                    </Button>
                    {!saved ? (
                      <>
                        <Button variant="outline" className="flex-1 min-w-[150px]" onClick={handleSave}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Save to My Ideas
                        </Button>
                        <Button variant="outline" className="flex-1 min-w-[150px]" onClick={handleReset}>Analyze Another Idea</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" className="flex-1 min-w-[150px]" onClick={() => navigate("/ideas")}>
                          View My Ideas <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                        <Button variant="outline" className="flex-1 min-w-[150px]" onClick={handleReset}>Analyze Another</Button>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Free user actions */}
              {!isPaid && (
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="flex-1 min-w-[150px]" onClick={handleReset}>Analyze Another Idea</Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProblemStatementWizard;
