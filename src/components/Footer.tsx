import { Sparkles, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-display font-bold text-xl mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-background">Spark Guidance</span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed max-w-sm mb-6">
              Empowering the next generation of innovators with mentorship, competitions, hackathons, and courses — all in one platform.
            </p>
            <div className="space-y-2 text-sm text-background/50">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@sparkguidance.com</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 98765 43210</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Bengaluru, India</div>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-background mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/ideas" className="text-sm text-background/50 hover:text-background transition-colors">Idea Lab</Link></li>
              <li><Link to="/submit-idea" className="text-sm text-background/50 hover:text-background transition-colors">AI Analyzer</Link></li>
              <li><Link to="/hackathons" className="text-sm text-background/50 hover:text-background transition-colors">Hackathons</Link></li>
              <li><Link to="/mentors" className="text-sm text-background/50 hover:text-background transition-colors">Mentors</Link></li>
              <li><Link to="/courses" className="text-sm text-background/50 hover:text-background transition-colors">Courses</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-background mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/patents" className="text-sm text-background/50 hover:text-background transition-colors">Patent Filing</Link></li>
              <li><Link to="/investors" className="text-sm text-background/50 hover:text-background transition-colors">Investors</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-background mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-sm text-background/50 hover:text-background transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/disclaimer" className="text-sm text-background/50 hover:text-background transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-background/40">
          <span>© {new Date().getFullYear()} Spark Guidance. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-background/60 transition-colors">Terms</Link>
            <Link to="/disclaimer" className="hover:text-background/60 transition-colors">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
