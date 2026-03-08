import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AlertTriangle } from "lucide-react";

const DisclaimerPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="w-8 h-8 text-spark-amber" />
            <h1 className="text-3xl md:text-4xl font-bold font-display">
              <span className="text-gradient-warm">Disclaimer</span>
            </h1>
          </div>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <div className="bg-spark-amber/10 border border-spark-amber/20 rounded-2xl p-6">
              <h2 className="text-lg font-bold font-display text-card-foreground mt-0">Important Notice</h2>
              <p className="mb-0">The information provided on Spark Guidance is for general informational and educational purposes only. It is not intended as, and should not be construed as, professional advice of any kind.</p>
            </div>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">AI-Generated Analysis</h2>
              <p>Market valuations, competitor analyses, target customer segments, and scoring provided by our AI system are <strong>estimates based on algorithmic analysis</strong>. These should be validated independently through proper market research before making business decisions.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">No Professional Advice</h2>
              <p>Nothing on this platform constitutes legal, financial, investment, or patent advice. For professional guidance, please consult qualified professionals in the relevant fields.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">TRL Assessment</h2>
              <p>Technology Readiness Level (TRL) assessments on this platform are self-reported and AI-estimated. They may not correspond to formal TRL assessments used by government agencies or research institutions.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">Investment Risks</h2>
              <p>Connecting with investors through this platform does not guarantee funding. All investment activities carry inherent risks. Users should perform due diligence before entering any financial agreements.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">Third-Party Content</h2>
              <p>Mentor advice, course content, and investor information are provided by third parties. Spark Guidance does not endorse or verify the accuracy of third-party content.</p>
            </section>

            <p className="text-xs text-muted-foreground pt-4 border-t border-border">Last updated: March 8, 2026</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DisclaimerPage;
