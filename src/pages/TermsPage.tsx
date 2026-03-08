import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-8">
            Terms & <span className="text-gradient-warm">Conditions</span>
          </h1>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">1. Acceptance of Terms</h2>
              <p>By creating an account or using Innovo Spark Guidance, you agree to these Terms & Conditions. If you do not agree, do not use the platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">2. User Accounts</h2>
              <p>You must provide accurate information during registration. You are responsible for maintaining the confidentiality of your account credentials. You must be at least 13 years old to use this platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">3. Intellectual Property</h2>
              <p>All ideas, problem statements, and solutions submitted remain the intellectual property of the user who submitted them. Innovo Spark Guidance does not claim ownership of user-submitted content. By making an idea public, you grant other users viewing rights only — not the right to copy or commercialize your idea.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">4. AI Analysis Disclaimer</h2>
              <p>Market analysis, scoring, and recommendations provided by our AI are for informational purposes only. They should not be taken as professional business, legal, or financial advice. Scores and market data are estimates and may not reflect actual market conditions.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">5. Mentorship & Bookings</h2>
              <p>Mentor sessions are facilitated through the platform. Innovo Spark Guidance is not responsible for the quality of advice provided by mentors. Cancellation and refund policies apply as stated at the time of booking.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">6. Hackathon Participation</h2>
              <p>By registering for hackathons, you agree to the specific rules of each event. Prizes are distributed per hackathon terms. Innovo Spark Guidance reserves the right to disqualify participants for misconduct.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">7. Patent Registration</h2>
              <p>Patent tracking features are organizational tools only. Innovo Spark Guidance does not provide legal patent filing services. Users should consult a registered patent attorney for official filings.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">8. Investor Connections</h2>
              <p>Investor contact information and connections are provided as-is. Innovo Spark Guidance does not guarantee funding outcomes. All investment decisions are between users and investors independently.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">9. Privacy</h2>
              <p>We collect and store data necessary for platform functionality. Private ideas are visible only to the submitter. We do not sell user data to third parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">10. Limitation of Liability</h2>
              <p>Innovo Spark Guidance is provided "as is" without warranties. We are not liable for any business decisions made based on platform data or AI recommendations. Maximum liability is limited to the amount paid by the user in the past 12 months.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold font-display text-card-foreground">11. Modifications</h2>
              <p>We may update these terms at any time. Continued use after changes constitutes acceptance. Users will be notified of significant changes via email.</p>
            </section>

            <p className="text-xs text-muted-foreground pt-4 border-t border-border">Last updated: March 8, 2026</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;
