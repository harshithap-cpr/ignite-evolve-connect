import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

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

const trlGuidance: Record<number, string[]> = {
  1: ["Document your core hypothesis", "Research existing literature", "Identify key scientific principles"],
  2: ["Define practical applications", "Sketch initial concept designs", "Talk to 10+ potential users"],
  3: ["Build a basic proof of concept", "Validate technical feasibility", "Seek mentor feedback on approach"],
  4: ["Test components in controlled settings", "Document test results", "Refine based on lab findings"],
  5: ["Test in real-world-like conditions", "Measure performance metrics", "Compare against requirements"],
  6: ["Build a working prototype", "Demo to potential users/stakeholders", "Join a hackathon to accelerate"],
  7: ["Deploy in real operational setting", "Gather user feedback", "Iterate on usability"],
  8: ["Complete full system testing", "Get certifications if needed", "Prepare go-to-market strategy"],
  9: ["Launch commercially", "Scale operations", "Connect with investors for growth funding"],
};

interface TRLTrackerProps {
  currentLevel: number;
  onLevelChange?: (level: number) => void;
  compact?: boolean;
}

const TRLTracker = ({ currentLevel, onLevelChange, compact = false }: TRLTrackerProps) => {
  const currentTRL = trlLevels.find((t) => t.level === currentLevel) || trlLevels[0];
  const nextSteps = trlGuidance[currentLevel] || [];

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">TRL {currentLevel}</Badge>
          <span className="text-sm font-semibold text-card-foreground">{currentTRL.name}</span>
          <Badge variant="outline" className="text-[10px]">{currentTRL.phase}</Badge>
        </div>

        {/* Progress bar */}
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

        {/* Next steps */}
        {nextSteps.length > 0 && (
          <div className="p-3 bg-secondary/50 rounded-xl">
            <p className="text-xs font-bold text-muted-foreground mb-1">📋 Next Steps for TRL {currentLevel}:</p>
            <ul className="text-xs text-card-foreground space-y-0.5">
              {nextSteps.map((step, i) => (
                <li key={i}>• {step}</li>
              ))}
            </ul>
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

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <h4 className="font-bold text-sm text-card-foreground mb-2">🎯 Your Next Steps (TRL {currentLevel})</h4>
          <div className="space-y-2">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-card-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TRLTracker;
