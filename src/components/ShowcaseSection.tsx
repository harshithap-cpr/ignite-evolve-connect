import { motion } from "framer-motion";
import { Lightbulb, Cpu, TestTube, Presentation } from "lucide-react";

const stages = [
  { icon: Lightbulb, title: "Ideation", description: "Submit and refine your innovative idea", color: "bg-primary/10 text-primary" },
  { icon: Cpu, title: "Prototype", description: "Build your first working prototype", color: "bg-spark-amber/10 text-spark-amber" },
  { icon: TestTube, title: "Validation", description: "Test and validate with real users", color: "bg-spark-teal/10 text-spark-teal" },
  { icon: Presentation, title: "Showcase", description: "Present to mentors and investors", color: "bg-spark-coral/10 text-spark-coral" },
];

const ShowcaseSection = () => {
  return (
    <section id="hackathons" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            From Idea to{" "}
            <span className="text-gradient-warm">Showcase</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Track your innovation journey through structured stages with guidance at every step.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stages.map((stage, idx) => (
            <motion.div
              key={stage.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="relative text-center p-6"
            >
              {idx < stages.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
              <div className={`w-14 h-14 rounded-2xl ${stage.color} flex items-center justify-center mx-auto mb-4 relative z-10`}>
                <stage.icon className="w-7 h-7" />
              </div>
              <div className="text-xs font-bold text-muted-foreground mb-1">Stage {idx + 1}</div>
              <h3 className="font-bold font-display text-foreground mb-1">{stage.title}</h3>
              <p className="text-sm text-muted-foreground">{stage.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
