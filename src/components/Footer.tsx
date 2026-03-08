import { Sparkles, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    Platform: ["Features", "Hackathons", "Competitions", "Mentors", "Courses"],
    Company: ["About Us", "Careers", "Blog", "Contact", "Press"],
    Support: ["Help Center", "Community", "Guidelines", "Privacy Policy", "Terms"],
  };

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
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> hello@sparkguidance.com
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> +91 98765 43210
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Bengaluru, India
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-bold text-background mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-background/50 hover:text-background transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-background/10 pt-6 text-center text-sm text-background/40">
          © {new Date().getFullYear()} Spark Guidance. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
