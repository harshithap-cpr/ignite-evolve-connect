import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for exploring the platform",
    features: [
      "Basic registration & profile",
      "Access to limited competitions",
      "View courses catalog",
      "Basic mentor directory",
      "Community forums access",
    ],
    cta: "Get Started Free",
    variant: "hero-outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "For serious innovators ready to grow",
    features: [
      "Unlimited hackathon participation",
      "Priority mentor booking",
      "Advanced project stage tracking",
      "Access to all premium courses",
      "Certificate downloads",
      "Team collaboration tools",
    ],
    cta: "Start Pro Plan",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Premium",
    price: "₹1,499",
    period: "/month",
    description: "Full access with personal guidance",
    features: [
      "Personal innovation mentor",
      "Startup incubation guidance",
      "Investor pitch opportunities",
      "Advanced project analytics",
      "Exclusive competitions & hackathons",
      "Priority support",
    ],
    cta: "Go Premium",
    variant: "hero-outline" as const,
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            Plans That Grow{" "}
            <span className="text-gradient-warm">With You</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Start free and upgrade as your innovation journey evolves. Every plan includes core platform access.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl p-6 border ${
                plan.popular
                  ? "border-primary shadow-warm bg-card scale-105"
                  : "border-border bg-card shadow-soft"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-warm text-primary-foreground text-xs font-bold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold font-display text-card-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold font-display text-card-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-spark-teal mt-0.5 shrink-0" />
                    <span className="text-card-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant={plan.variant} className="w-full">
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
