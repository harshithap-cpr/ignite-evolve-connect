import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-gradient-warm rounded-3xl p-10 md:p-16 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative z-10">
            <Rocket className="w-12 h-12 text-primary-foreground/80 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold font-display text-primary-foreground mb-4">
              Ready to Spark Your Next Big Idea?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
              Join thousands of innovators, mentors, and creators building the future together on Innovo Spark Guidance.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="bg-primary-foreground text-primary border-primary-foreground hover:bg-primary-foreground/90 hover:text-primary rounded-full font-semibold text-base px-8"
            >
              Join Innvo Spark Guidance — It's Free
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
