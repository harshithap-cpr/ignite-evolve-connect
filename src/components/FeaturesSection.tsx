import { motion } from "framer-motion";
import {
  Users,
  Trophy,
  Code2,
  BookOpen,
  Layers,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Mentor Connect",
    description: "Get one-on-one guidance from industry experts. Book sessions, chat, and receive feedback on your projects.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Trophy,
    title: "Competition Hub",
    description: "Discover innovation competitions, register easily, and earn certificates and digital badges.",
    color: "bg-spark-coral/10 text-spark-coral",
  },
  {
    icon: Code2,
    title: "Hackathon Platform",
    description: "Join hackathons, form teams, access problem statements, and submit your solutions all in one place.",
    color: "bg-spark-teal/10 text-spark-teal",
  },
  {
    icon: Layers,
    title: "Project Stage Tracker",
    description: "Track your project from idea to showcase with a visual progress dashboard across every stage.",
    color: "bg-spark-amber/10 text-spark-amber",
  },
  {
    icon: BookOpen,
    title: "Course Learning",
    description: "Learn innovation, entrepreneurship, and essential skills through video lessons and curated modules.",
    color: "bg-spark-lavender/10 text-spark-lavender",
  },
  {
    icon: Star,
    title: "Ratings & Reviews",
    description: "Rate courses, read peer reviews, and discover the best learning content recommended by the community.",
    color: "bg-primary/10 text-primary",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            Everything You Need to{" "}
            <span className="text-gradient-warm">Innovate</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From mentorship to hackathons, courses to competitions — Innvo Spark Guidance brings your entire innovation toolkit together.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group p-6 rounded-2xl border border-border bg-card hover:shadow-warm transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display mb-2 text-card-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
