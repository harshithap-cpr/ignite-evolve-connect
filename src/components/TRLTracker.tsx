import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { ExternalLink, Sparkles, Loader2, ShoppingCart, Cpu, Wrench, FlaskConical } from "lucide-react";
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

interface GuidanceData {
  steps: string[];
  resources: { label: string; url: string }[];
  procurement: { software: string[]; hardware: string[] };
  pocMethodology: string;
  validationChecklist: string[];
}

const trlGuidance: Record<number, GuidanceData> = {
  1: {
    steps: ["Document your core hypothesis", "Research existing literature", "Identify key scientific principles"],
    resources: [
      { label: "Google Scholar", url: "https://scholar.google.com" },
      { label: "NASA TRL Guide", url: "https://www.nasa.gov/directorates/somd/space-communications-navigation-program/technology-readiness-levels/" },
    ],
    procurement: {
      software: ["Reference management (Zotero/Mendeley — free)", "Note-taking (Notion/Obsidian — free tier)", "Mind mapping (Miro — free tier)"],
      hardware: ["No hardware needed at this stage", "Optional: Whiteboard / sticky notes for brainstorming"],
    },
    pocMethodology: "Design Thinking — Empathize & Define phases. Focus on understanding the problem space through user interviews, literature review, and observation before jumping to solutions.",
    validationChecklist: [
      "Core scientific principle clearly documented",
      "Literature review completed (min 10 papers/sources)",
      "Problem statement validated with 5+ domain experts",
      "No existing solution fully solves this problem",
      "Technical feasibility hypothesis written",
    ],
  },
  2: {
    steps: ["Define practical applications", "Sketch initial concept designs", "Talk to 10+ potential users"],
    resources: [
      { label: "Lean Canvas Template", url: "https://leanstack.com/lean-canvas" },
      { label: "Customer Discovery Guide", url: "https://www.startupschool.org" },
    ],
    procurement: {
      software: ["Wireframing (Figma — free tier)", "Survey tools (Google Forms / Typeform — free)", "Lean Canvas (Canvanizer — free)"],
      hardware: ["No hardware needed at this stage", "Optional: Drawing tablet for concept sketches"],
    },
    pocMethodology: "Lean Startup — Build-Measure-Learn. Create a Lean Canvas to map your business model. Conduct customer discovery interviews to validate demand before building anything.",
    validationChecklist: [
      "Lean Canvas completed with all 9 blocks",
      "10+ potential user interviews conducted",
      "Target customer persona defined",
      "Unique value proposition articulated clearly",
      "At least 2 practical applications identified",
      "Competitive landscape mapped",
    ],
  },
  3: {
    steps: ["Build a basic proof of concept", "Validate technical feasibility", "Seek mentor feedback on approach"],
    resources: [
      { label: "Figma Prototyping", url: "https://figma.com" },
      { label: "Y Combinator Library", url: "https://www.ycombinator.com/library" },
    ],
    procurement: {
      software: ["IDE / code editor (VS Code — free)", "Version control (GitHub — free)", "Prototyping (Figma / Framer — free tier)", "Cloud compute (AWS/GCP free tier)"],
      hardware: ["Dev board (Arduino Uno ~₹500 / Raspberry Pi ~₹3,500)", "Breadboard & components kit (~₹800)", "Sensors specific to your domain", "USB cables, jumper wires, multimeter"],
    },
    pocMethodology: "Agile Spike + Design Thinking Prototype. Build the minimum experiment to prove your core technical assumption works. Time-box to 2 weeks. Focus on the riskiest assumption first.",
    validationChecklist: [
      "Core technical assumption proven with working code/circuit",
      "PoC demonstrates the key differentiating feature",
      "At least 1 mentor reviewed and gave feedback",
      "Technical risks identified and documented",
      "PoC results recorded with data/screenshots/video",
      "Bill of materials (BoM) estimated for next phase",
    ],
  },
  4: {
    steps: ["Test components in controlled settings", "Document test results", "Refine based on lab findings"],
    resources: [
      { label: "Testing Frameworks", url: "https://en.wikipedia.org/wiki/Software_testing" },
      { label: "Lab Safety Protocols", url: "https://www.osha.gov/laboratories" },
    ],
    procurement: {
      software: ["Testing frameworks (Jest/Pytest — free)", "CI/CD (GitHub Actions — free tier)", "Data logging (InfluxDB / Google Sheets)", "PCB design (KiCad — free)"],
      hardware: ["Oscilloscope (~₹8,000 for basic)", "Soldering station (~₹2,500)", "Custom PCB prototype (JLCPCB ~₹500/batch)", "3D printer access (FabLab/Makerspace)", "Enclosure materials"],
    },
    pocMethodology: "V-Model Verification. Systematic testing where each component is verified against its specification. Create test plans before testing. Document pass/fail for each requirement.",
    validationChecklist: [
      "All components tested individually in lab environment",
      "Test results documented with quantitative data",
      "Performance meets minimum spec requirements",
      "Failure modes identified and mitigated",
      "Component integration tested (subsystem level)",
      "Lab notebook / test log maintained",
      "Safety review completed",
    ],
  },
  5: {
    steps: ["Test in real-world-like conditions", "Measure performance metrics", "Compare against requirements"],
    resources: [
      { label: "A/B Testing Guide", url: "https://www.optimizely.com/optimization-glossary/ab-testing/" },
      { label: "Performance Benchmarking", url: "https://www.nist.gov" },
    ],
    procurement: {
      software: ["Monitoring (Grafana — free)", "Analytics (PostHog — free tier)", "Load testing (k6 — free)", "Error tracking (Sentry — free tier)"],
      hardware: ["Environmental test chambers (rent from lab)", "Power supply unit (regulated, ~₹5,000)", "Data acquisition module (DAQ)", "Field test enclosures (IP65 rated)", "Portable measurement instruments"],
    },
    pocMethodology: "Agile Iteration + Field Testing. Deploy in a controlled-but-realistic environment. Run structured test cycles (1-2 week sprints). Collect quantitative performance data against requirements spec.",
    validationChecklist: [
      "System tested in conditions matching real-world use",
      "Performance metrics recorded against requirements spec",
      "Environmental factors (temp, humidity, vibration) tested",
      "System operates for sustained duration without failure",
      "User acceptance testing with 3+ representative users",
      "Edge cases and boundary conditions tested",
      "Comparison report vs. requirements completed",
    ],
  },
  6: {
    steps: ["Build a working prototype", "Demo to potential users/stakeholders", "Join a hackathon to accelerate"],
    resources: [
      { label: "Product Hunt", url: "https://www.producthunt.com" },
      { label: "Devpost Hackathons", url: "https://devpost.com" },
    ],
    procurement: {
      software: ["Cloud hosting (AWS/Vercel — startup credits)", "Design system (Tailwind/Material UI — free)", "Demo recording (Loom — free)", "Project management (Linear/Jira — free tier)"],
      hardware: ["Professional-grade PCB assembly", "Custom enclosure (CNC/injection mold prototype ~₹15,000)", "Production-quality sensors & actuators", "Professional finishing materials", "Demo unit packaging"],
    },
    pocMethodology: "Sprint Demo + Stakeholder Validation. Build a near-production prototype. Conduct structured demo sessions with target users and investors. Collect NPS and willingness-to-pay data.",
    validationChecklist: [
      "Working prototype with production-like quality",
      "Demo conducted for 5+ potential customers/users",
      "Stakeholder feedback documented and prioritized",
      "User interface intuitive (no manual needed)",
      "Manufacturing/scaling feasibility assessed",
      "Cost per unit estimated for production",
      "IP/patent considerations reviewed",
    ],
  },
  7: {
    steps: ["Deploy in real operational setting", "Gather user feedback", "Iterate on usability"],
    resources: [
      { label: "User Testing", url: "https://www.usertesting.com" },
      { label: "Analytics Tools", url: "https://analytics.google.com" },
    ],
    procurement: {
      software: ["Production cloud infra (AWS/GCP — startup program)", "APM tools (Datadog/New Relic — startup tier)", "Customer feedback (Intercom — startup plan)", "CRM (HubSpot — free tier)"],
      hardware: ["Pilot production batch (10-50 units)", "Quality testing equipment", "Packaging & shipping materials", "Field service toolkit", "Spare parts inventory"],
    },
    pocMethodology: "Beta Launch + Continuous Improvement. Deploy with select pilot customers. Use telemetry and direct feedback loops. Iterate weekly on top pain points. Validate unit economics.",
    validationChecklist: [
      "System deployed in real operational environment",
      "5+ pilot users actively using the product",
      "Uptime/reliability meets SLA targets",
      "User feedback loop established and active",
      "Support/maintenance process defined",
      "Unit economics validated (cost vs. revenue)",
      "Regulatory compliance checked",
    ],
  },
  8: {
    steps: ["Complete full system testing", "Get certifications if needed", "Prepare go-to-market strategy"],
    resources: [
      { label: "Go-to-Market Framework", url: "https://www.hubspot.com/go-to-market-strategy" },
      { label: "ISO Standards", url: "https://www.iso.org" },
    ],
    procurement: {
      software: ["ERP system (Zoho — startup plan)", "Billing/subscription (Stripe)", "Legal tools (DocuSign — startup plan)", "Marketing (Mailchimp — free tier)"],
      hardware: ["Production tooling & molds", "Assembly line setup / contract manufacturer", "Certification testing equipment", "Compliance testing (EMC, safety labs)", "Bulk component procurement"],
    },
    pocMethodology: "Waterfall Qualification + Launch Readiness. Systematic qualification testing against all specifications. Obtain certifications. Finalize manufacturing. Prepare marketing and sales channels.",
    validationChecklist: [
      "Full system testing completed and documented",
      "All required certifications obtained (CE/BIS/FCC etc.)",
      "Manufacturing process validated with trial run",
      "Quality control process established",
      "Go-to-market strategy finalized",
      "Pricing validated with target customers",
      "Sales and distribution channels identified",
      "Support and warranty terms defined",
    ],
  },
  9: {
    steps: ["Launch commercially", "Scale operations", "Connect with investors for growth funding"],
    resources: [
      { label: "Crunchbase", url: "https://www.crunchbase.com" },
      { label: "AngelList", url: "https://angel.co" },
    ],
    procurement: {
      software: ["Scale infrastructure (Kubernetes/AWS auto-scaling)", "Business intelligence (Metabase — free)", "HR & payroll tools", "Accounting (Zoho Books / QuickBooks)"],
      hardware: ["Volume manufacturing contracts", "Warehousing & logistics setup", "After-sales service infrastructure", "Spare parts supply chain", "International shipping & customs"],
    },
    pocMethodology: "Scale-up Operations. Focus shifts from product development to market growth. Optimize supply chain, customer acquisition cost, and lifetime value. Build repeatable sales process.",
    validationChecklist: [
      "Product launched to general market",
      "Revenue generated from paying customers",
      "Customer acquisition funnel established",
      "Operations scalable to 10x current volume",
      "Team structure supports growth",
      "Financial model validated with real data",
      "Growth funding strategy defined (if needed)",
      "IP portfolio secured",
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
  const guidance = trlGuidance[currentLevel] || { steps: [], resources: [], procurement: { software: [], hardware: [] }, pocMethodology: "", validationChecklist: [] };
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [aiTips, setAiTips] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiPocPlan, setAiPocPlan] = useState<string>("");
  const [loadingPoc, setLoadingPoc] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => prev === section ? null : section);
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
      const text = data?.feedback || data?.analysis?.feedback || "Unable to generate recommendations.";
      setAiTips(text);
    } catch {
      toast.error("Could not load AI recommendations");
    } finally {
      setLoadingAi(false);
    }
  };

  const getAiPocPlan = async () => {
    setLoadingPoc(true);
    setAiPocPlan("");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-idea", {
        body: {
          title: ideaTitle || "My Innovation",
          problemStatement: ideaDescription || "",
          proposedSolution: "",
          targetAudience: "",
          uniqueValue: "",
          customPrompt: `You are a product development advisor. The user's idea "${ideaTitle || "their project"}" is at TRL ${currentLevel}.

Generate a personalized Proof of Concept plan including:
1. **Recommended Software Tools** — specific tools/platforms with estimated costs (prioritize free/open-source)
2. **Recommended Hardware** — specific components, dev boards, or equipment with estimated costs in INR
3. **PoC Development Steps** — 5-7 step methodology to build and validate the proof of concept
4. **Budget Estimate** — rough total cost breakdown for software, hardware, and testing
5. **Timeline** — estimated weeks to complete each step

Be specific to their idea domain. Use Indian Rupee (₹) for costs. Format with markdown headers and bullet points.`,
        },
      });
      if (error) throw error;
      const text = data?.feedback || data?.analysis?.feedback || "Unable to generate PoC plan.";
      setAiPocPlan(text);
    } catch {
      toast.error("Could not generate PoC plan");
    } finally {
      setLoadingPoc(false);
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
            <button key={t.level} onClick={() => onLevelChange?.(t.level)}
              className={`h-2 flex-1 rounded-full transition-all cursor-pointer hover:opacity-80 ${t.level <= currentLevel ? t.color : "bg-muted"}`}
              title={`TRL ${t.level}: ${t.name}`} />
          ))}
        </div>

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
          <motion.button key={t.level} onClick={() => onLevelChange?.(t.level)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
              t.level === currentLevel ? "bg-primary/10 border-2 border-primary"
                : t.level < currentLevel ? "bg-secondary/50 opacity-60" : "bg-muted/30 opacity-40"
            }`} whileHover={{ scale: 1.01 }}>
            <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0`}>{t.level}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-card-foreground">{t.name}</span>
                <Badge variant="outline" className="text-[10px]">{t.phase}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{t.desc}</p>
            </div>
            {t.level === currentLevel && <Badge variant="default" className="text-[10px] shrink-0">Current</Badge>}
            {t.level < currentLevel && <span className="text-spark-teal text-xs">✓</span>}
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

      {/* Procurement Guidance */}
      <div className="mb-4">
        <button onClick={() => toggleSection("procurement")}
          className="w-full flex items-center justify-between p-4 bg-spark-teal/10 rounded-xl border border-spark-teal/20 hover:bg-spark-teal/15 transition-colors">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-spark-teal" />
            <h4 className="font-bold text-sm text-card-foreground">🛒 Software & Hardware Procurement</h4>
          </div>
          <span className="text-xs text-muted-foreground">{expandedSection === "procurement" ? "▲" : "▼"}</span>
        </button>
        {expandedSection === "procurement" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-3">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-primary" />
                <h5 className="font-semibold text-sm text-card-foreground">Software Tools</h5>
              </div>
              <ul className="space-y-1.5">
                {guidance.procurement.software.map((item, i) => (
                  <li key={i} className="text-xs text-card-foreground flex items-start gap-2">
                    <span className="text-spark-teal mt-0.5">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-spark-amber" />
                <h5 className="font-semibold text-sm text-card-foreground">Hardware & Equipment</h5>
              </div>
              <ul className="space-y-1.5">
                {guidance.procurement.hardware.map((item, i) => (
                  <li key={i} className="text-xs text-card-foreground flex items-start gap-2">
                    <span className="text-spark-amber mt-0.5">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>

      {/* PoC Methodology */}
      <div className="mb-4">
        <button onClick={() => toggleSection("poc")}
          className="w-full flex items-center justify-between p-4 bg-spark-lavender/10 rounded-xl border border-spark-lavender/20 hover:bg-spark-lavender/15 transition-colors">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-spark-lavender" />
            <h4 className="font-bold text-sm text-card-foreground">🧪 PoC Methodology & Validation</h4>
          </div>
          <span className="text-xs text-muted-foreground">{expandedSection === "poc" ? "▲" : "▼"}</span>
        </button>
        {expandedSection === "poc" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-3">
            {/* Methodology */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h5 className="font-semibold text-sm text-card-foreground mb-2">📖 Recommended Methodology</h5>
              <p className="text-xs text-card-foreground leading-relaxed">{guidance.pocMethodology}</p>
            </div>

            {/* Validation Checklist */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h5 className="font-semibold text-sm text-card-foreground mb-3">🎯 Validation Checklist</h5>
              <div className="space-y-2">
                {guidance.validationChecklist.map((item, i) => {
                  const key = `val-${currentLevel}-${i}`;
                  return (
                    <label key={i} className="flex items-start gap-2.5 text-xs cursor-pointer">
                      <Checkbox checked={!!checkedItems[key]} onCheckedChange={() => toggleCheck(key)} className="mt-0.5" />
                      <span className={checkedItems[key] ? "line-through text-muted-foreground" : "text-card-foreground"}>{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* AI PoC Plan */}
            <div className="bg-spark-amber/10 rounded-xl p-4 border border-spark-amber/20">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-bold text-sm text-card-foreground">🤖 AI-Powered PoC Plan</h5>
                <Button variant="outline" size="sm" onClick={getAiPocPlan} disabled={loadingPoc} className="rounded-full text-xs">
                  {loadingPoc ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  {loadingPoc ? "Planning..." : "Generate Plan"}
                </Button>
              </div>
              {aiPocPlan ? (
                <div className="text-xs text-card-foreground whitespace-pre-line leading-relaxed max-h-[400px] overflow-y-auto">{aiPocPlan}</div>
              ) : (
                <p className="text-[11px] text-muted-foreground">Get a personalized PoC plan with specific tools, hardware recommendations, budget estimate, and timeline tailored to your idea.</p>
              )}
            </div>
          </motion.div>
        )}
      </div>

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
