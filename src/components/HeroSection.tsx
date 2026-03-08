import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-illustration.jpg";
import DemoWalkthrough from "@/components/DemoWalkthrough";

const HeroSection = () => {
  const [demoOpen, setDemoOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-hero overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-glow-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-spark-coral/10 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-spark-teal animate-pulse" />
              Your Innovation Journey Starts Here
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
              Ignite Your Ideas with{" "}
              <span className="text-gradient-warm">Spark Guidance</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Connect with mentors, join hackathons, compete in challenges, and transform your innovative ideas into reality — all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="text-base px-8" onClick={() => navigate("/submit-idea")}>
                Submit Your Idea
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base px-8" onClick={() => setDemoOpen(true)}>
                <Play className="w-4 h-4 mr-1" />
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">2,000+</span> innovators already onboard
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-warm">
              <img src={heroImage} alt="Innovators collaborating on projects" className="w-full h-auto" loading="eager" />
            </div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-card rounded-xl shadow-soft p-3 border border-border"
            >
              <div className="text-2xl font-bold font-display text-foreground">150+</div>
              <div className="text-xs text-muted-foreground">Mentors</div>
            </motion.div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-soft p-3 border border-border"
            >
              <div className="text-2xl font-bold font-display text-spark-teal">50+</div>
              <div className="text-xs text-muted-foreground">Hackathons</div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <DemoWalkthrough open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
};

export default HeroSection;
