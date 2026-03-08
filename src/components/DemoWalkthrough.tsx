import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserPlus,
  Lightbulb,
  Users,
  Trophy,
  BookOpen,
  FileText,
  TrendingUp,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const demoSteps = [
  {
    icon: Sparkles,
    title: "Welcome to Innvo Spark Guidance",
    description: "Your all-in-one innovation platform to transform ideas into reality. Let us walk you through how it works!",
    image: "🚀",
    color: "bg-primary/10 text-primary",
    action: null,
  },
  {
    icon: UserPlus,
    title: "Step 1: Create Your Account",
    description: "Sign up with your email to get started. Your profile auto-creates with space for skills, interests, and achievements. You can join as a Student, Innovator, or Mentor.",
    image: "📝",
    color: "bg-spark-teal/10 text-spark-teal",
    action: { label: "Sign Up Now", route: "/auth" },
  },
  {
    icon: Lightbulb,
    title: "Step 2: Submit Your Problem Statement",
    description: "Head to Idea Lab and enter your problem statement, proposed solution, target audience, and unique value. Our system automatically scores your idea on Innovation, Feasibility, and Market potential!",
    image: "💡",
    color: "bg-spark-amber/10 text-spark-amber",
    action: { label: "Go to Idea Lab", route: "/ideas" },
  },
  {
    icon: TrendingUp,
    title: "Step 3: Follow Stage-by-Stage Guidance",
    description: "Your idea moves through 5 stages: Ideation → Validation → Prototype → MVP → Growth. At each stage, you get specific guidance on what to do next, who to talk to, and how to improve.",
    image: "📈",
    color: "bg-primary/10 text-primary",
    action: { label: "Start Your Journey", route: "/ideas" },
  },
  {
    icon: Users,
    title: "Step 4: Connect with Mentors",
    description: "Browse expert mentors from top companies like Google, Microsoft, and Flipkart. Book one-on-one sessions to get feedback on your project, refine your pitch, and get guidance.",
    image: "👩‍🏫",
    color: "bg-spark-lavender/10 text-spark-lavender",
    action: { label: "Browse Mentors", route: "/mentors" },
  },
  {
    icon: Trophy,
    title: "Step 5: Join Hackathons & Competitions",
    description: "Participate in exciting hackathons with real prizes. Form teams, access problem statements, submit solutions, and get evaluated by expert judges. Earn certificates and badges!",
    image: "🏆",
    color: "bg-spark-coral/10 text-spark-coral",
    action: { label: "View Hackathons", route: "/hackathons" },
  },
  {
    icon: BookOpen,
    title: "Step 6: Learn & Upskill",
    description: "Access curated courses on Innovation, AI/ML, Entrepreneurship, Product Management, and more. Rate courses, read reviews, and earn completion certificates.",
    image: "📚",
    color: "bg-spark-teal/10 text-spark-teal",
    action: { label: "Explore Courses", route: "/courses" },
  },
  {
    icon: FileText,
    title: "Step 7: Register Your Patent",
    description: "Protect your invention! Our patent tracker guides you through each filing stage — from draft to granted — with step-by-step instructions for Indian Patent Office submissions.",
    image: "📄",
    color: "bg-spark-amber/10 text-spark-amber",
    action: { label: "Patent Registration", route: "/patents" },
  },
  {
    icon: Briefcase,
    title: "Step 8: Connect with Investors",
    description: "When you're ready to scale, browse our investor directory — Angel investors, VCs, accelerators, incubators, and government programs. Send pitch messages and get funding!",
    image: "🤝",
    color: "bg-primary/10 text-primary",
    action: { label: "Find Investors", route: "/investors" },
  },
  {
    icon: Sparkles,
    title: "You're All Set! 🎉",
    description: "That's the complete Innvo Spark Guidance journey! Start by submitting your problem statement, and we'll guide you step by step from idea to funded startup.",
    image: "✨",
    color: "bg-gradient-warm text-primary-foreground",
    action: { label: "Get Started Now", route: "/auth" },
  },
];

interface DemoWalkthroughProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DemoWalkthrough = ({ open, onOpenChange }: DemoWalkthroughProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const step = demoSteps[currentStep];

  const goNext = () => {
    if (currentStep < demoSteps.length - 1) setCurrentStep(currentStep + 1);
  };
  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };
  const handleAction = () => {
    if (step.action) {
      onOpenChange(false);
      setCurrentStep(0);
      navigate(step.action.route);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setCurrentStep(0); }}>
      <DialogContent className="rounded-2xl max-w-xl p-0 overflow-hidden border-none">
        <div className="relative">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-gradient-warm transition-all duration-500"
              style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
            />
          </div>

          {/* Close */}
          <button onClick={() => { onOpenChange(false); setCurrentStep(0); }} className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              {/* Icon & Step number */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {currentStep + 1} / {demoSteps.length}
                </span>
              </div>

              {/* Big emoji */}
              <div className="text-6xl mb-4">{step.image}</div>

              {/* Content */}
              <h2 className="text-2xl font-bold font-display text-foreground mb-3">{step.title}</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">{step.description}</p>

              {/* Action button */}
              {step.action && (
                <Button variant="hero" className="mb-4" onClick={handleAction}>
                  {step.action.label} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between px-8 pb-6">
            <Button variant="ghost" size="sm" onClick={goPrev} disabled={currentStep === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>

            {/* Dots */}
            <div className="flex gap-1.5">
              {demoSteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? "bg-primary w-6" : "bg-muted hover:bg-muted-foreground/30"}`}
                />
              ))}
            </div>

            {currentStep < demoSteps.length - 1 ? (
              <Button variant="default" size="sm" onClick={goNext}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="hero" size="sm" onClick={() => { onOpenChange(false); setCurrentStep(0); navigate("/auth"); }}>
                Let's Go! <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoWalkthrough;
