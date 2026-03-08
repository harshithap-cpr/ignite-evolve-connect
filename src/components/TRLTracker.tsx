import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const trlLevels = [
  { level: 1, name: "Basic Principles", desc: "Scientific research begins. Basic principles are observed and reported.", phase: "Research", color: "bg-spark-lavender" },
  { level: 2, name: "Concept Formulated", desc: "Technology concept and application formulated. Practical applications identified.", phase: "Research", color: "bg-spark-lavender" },
  { level: 3, name: "Proof of Concept", desc: "Analytical and experimental proof of concept. Active R&D initiated.", phase: "Research", color: "bg-spark-lavender" },
  { level: 4, name: "Lab Validation", desc: "Component or breadboard validated in laboratory environment.", phase: "Development", color: "bg-spark-teal" },
  { level: 5, name: "Relevant Environment", desc: "Component validated in a relevant environment. Fidelity increases significantly.", phase: "Development", color: "bg-spark-teal" },
  { level: 6, name: "Prototype Demo", desc: "System/subsystem model or prototype demonstrated in a relevant environment.", phase: "Development", color: "bg-spark-teal" },
  { level: 7, name: "Operational Demo", desc: "System prototype demonstrated in an operational environment.", phase: "Deployment", color: "bg-spark-amber" },
  { level: 8, name: "System Complete", desc: "Actual system completed and qualified through testing and demonstration.", phase: "Deployment", color: "bg-spark-amber" },
  { level: 9, name: "Market Ready", desc: "Actual system proven through successful deployment and operations.", phase: "Deployment", color: "bg-spark-coral" },
];

const trlGuidance: Record<number, { steps: string[]; resources: { label: string; url: string }[] }> = {
  1: {
    steps: ["Document your core hypothesis", "Research existing literature", "Identify key scientific principles"],
    resources: [
      { label: "Google Scholar", url: "https://scholar.google.com" },
      { label: "NASA TRL Guide", url: "https://www.nasa.gov/directorates/somd/space-communications-navigation-program/technology-readiness-levels/" },
    ],
  },
  2: {
    steps: ["Define practical applications", "Sketch initial concept designs", "Talk to 10+ potential users"],
    resources: [
      { label: "Lean Canvas Template", url: "https://leanstack.com/lean-canvas" },
      { label: "Customer Discovery Guide", url: "https://www.startupschool.org" },
    ],
  },
  3: {
    steps: ["Build a basic proof of concept", "Validate technical feasibility", "Seek mentor feedback on approach"],
    resources: [
      { label: "Figma Prototyping", url: "https://figma.com" },
      { label: "Y Combinator Library", url: "https://www.ycombinator.com/library" },
    ],
  },
  4: {
    steps: ["Test components in controlled settings", "Document test results", "Refine based on lab findings"],
    resources: [
      { label: "Testing Frameworks", url: "https://en.wikipedia.org/wiki/Software_testing" },
      { label: "Lab Safety Protocols", url: "https://www.osha.gov/laboratories" },
    ],
  },
  5: {
    steps: ["Test in real-world-like conditions", "Measure performance metrics", "Compare against requirements"],
    resources: [
      { label: "A/B Testing Guide", url: "https://www.optimizely.com/optimization-glossary/ab-testing/" },
      { label: "Performance Benchmarking", url: "https://www.nist.gov" },
    ],
  },
  6: {
    steps: ["Build a working prototype", "Demo to potential users/stakeholders", "Join a hackathon to accelerate"],
    resources: [
      { label: "Product Hunt", url: "https://www.producthunt.com" },
      { label: "Devpost Hackathons", url: "https://devpost.com" },
    ],
  },
  7: {
    steps: ["Deploy in real operational setting", "Gather user feedback", "Iterate on usability"],
    resources: [
      { label: "User Testing", url: "https://www.usertesting.com" },
      { label: "Analytics Tools", url: "https://analytics.google.com" },
    ],
  },
  8: {
    steps: ["Complete full system testing", "Get certifications if needed", "Prepare go-to-market strategy"],
    resources: [
      { label: "Go-to-Market Framework", url: "https://www.hubspot.com/go-to-market-strategy" },
      { label: "ISO Standards", url: "https://www.iso.org" },
    ],
  },
  9: {
    steps: ["Launch commercially", "Scale operations", "Connect with investors for growth funding"],
    resources: [
      { label: "Crunchbase", url: "https://www.crunchbase.com" },
      { label: "AngelList", url: "https://angel.co" },
    ],
  },
};

interface TRLTrackerProps {
  currentLevel: number;
  onLevelChange?: (level: number) => void;
  compact?: boolean;
  ideaTitle?: string;
  ideaDescription?: string;
}

const TRLTracker = ({ currentLevel, onLevelChange, compact = false, ideaTitle, ideaDescription }: TRLTrackerProps) => {
  const currentTRL = trlLevels.find((t) => t.level === currentLevel) || trlLevels[0];
  const guidance = trlGuidance[currentLevel] || { steps: [], resources: [] };
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [aiTips, setAiTips] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getAiRecommendations = async () => {
    setLoadingAi(true);
    setAiTips("");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-idea", {
        body: {
          title: ideaTitle || "My Innovation",
          problemStatement: ideaDescription || "",
          proposedSolution: "",
          targetAudience: "",
          uniqueValue: "",
          customPrompt: `You are a TRL advisor. The user's idea "${ideaTitle || "their project"}" is currently at TRL ${currentLevel} (${currentTRL.name}). Give 4-5 specific, actionable recommendations to advance to TRL ${Math.min(currentLevel + 1, 9)}. Be concise, practical, and tailored to their idea. Format as bullet points.`,
        },
      });
      if (error) throw error;
      const text = data?.feedback || data?.analysis?.feedback || "Unable to generate recommendations. Please try again.";
      setAiTips(text);
    } catch {
      toast.error("Could not load AI recommendations");
    } finally {
      setLoadingAi(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">TRL {currentLevel}</Badge>
          <span className="text-sm font-semibold text-card-foreground">{currentTRL.name}</span>
          <Badge variant="outline" className="text-[10px]">{currentTRL.phase}</Badge>
        </div>

        <div className="flex gap-0.5">
          {trlLevels.map((t) => (
            <button
              key={t.level}
              onClick={() => onLevelChange?.(t.level)}
              className={`h-2 flex-1 rounded-full transition-all cursor-pointer hover:opacity-80 ${
                t.level <= currentLevel ? t.color : "bg-muted"
              }`}
              title={`TRL ${t.level}: ${t.name}`}
            />
          ))}
        </div>

        {/* Milestone checklist */}
        {guidance.steps.length > 0 && (
          <div className="p-3 bg-secondary/50 rounded-xl space-y-2">
            <p className="text-xs font-bold text-muted-foreground">✅ Milestones for TRL {currentLevel}:</p>
            {guidance.steps.map((step, i) => {
              const key = `${currentLevel}-${i}`;
              return (
                <label key={i} className="flex items-start gap-2 text-xs cursor-pointer">
                  <Checkbox checked={!!checkedItems[key]} onCheckedChange={() => toggleCheck(key)} className="mt-0.5" />
                  <span className={checkedItems[key] ? "line-through text-muted-foreground" : "text-card-foreground"}>{step}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Resources */}
        {guidance.resources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {guidance.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <ExternalLink className="w-2.5 h-2.5" /> {r.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-display font-bold text-lg text-card-foreground mb-2">
        🔬 Technology Readiness Level (TRL)
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        TRL measures how close your technology is to being deployed. Click a level to update your stage.
      </p>

      {/* Visual TRL scale */}
      <div className="space-y-2 mb-6">
        {trlLevels.map((t) => (
          <motion.button
            key={t.level}
            onClick={() => onLevelChange?.(t.level)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
              t.level === currentLevel
                ? "bg-primary/10 border-2 border-primary"
                : t.level < currentLevel
                ? "bg-secondary/50 opacity-60"
                : "bg-muted/30 opacity-40"
            }`}
            whileHover={{ scale: 1.01 }}
          >
            <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0`}>
              {t.level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-card-foreground">{t.name}</span>
                <Badge variant="outline" className="text-[10px]">{t.phase}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{t.desc}</p>
            </div>
            {t.level === currentLevel && (
              <Badge variant="default" className="text-[10px] shrink-0">Current</Badge>
            )}
            {t.level < currentLevel && (
              <span className="text-spark-teal text-xs">✓</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Milestone Checklist */}
      {guidance.steps.length > 0 && (
        <div className="bg-secondary/30 rounded-xl p-4 border border-border mb-4">
          <h4 className="font-bold text-sm text-card-foreground mb-3">✅ Milestone Checklist (TRL {currentLevel})</h4>
          <div className="space-y-2.5">
            {guidance.steps.map((step, i) => {
              const key = `full-${currentLevel}-${i}`;
              return (
                <label key={i} className="flex items-start gap-2.5 text-sm cursor-pointer">
                  <Checkbox checked={!!checkedItems[key]} onCheckedChange={() => toggleCheck(key)} className="mt-0.5" />
                  <span className={checkedItems[key] ? "line-through text-muted-foreground" : "text-card-foreground"}>{step}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Resource Links */}
      {guidance.resources.length > 0 && (
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 mb-4">
          <h4 className="font-bold text-sm text-card-foreground mb-2">📚 Helpful Resources</h4>
          <div className="flex flex-wrap gap-2">
            {guidance.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                <ExternalLink className="w-3 h-3" /> {r.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="bg-spark-lavender/10 rounded-xl p-4 border border-spark-lavender/20">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sm text-card-foreground">🤖 AI-Powered Recommendations</h4>
          <Button variant="outline" size="sm" onClick={getAiRecommendations} disabled={loadingAi} className="rounded-full text-xs">
            {loadingAi ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
            {loadingAi ? "Analyzing..." : "Get Tips"}
          </Button>
        </div>
        {aiTips ? (
          <div className="text-sm text-card-foreground whitespace-pre-line leading-relaxed">{aiTips}</div>
        ) : (
          <p className="text-xs text-muted-foreground">Click "Get Tips" for personalized AI recommendations to advance your TRL stage.</p>
        )}
      </div>
    </div>
  );
};

export default TRLTracker;
