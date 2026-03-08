import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles, LogOut, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Hackathons", href: "/hackathons" },
  { label: "Mentors", href: "/mentors" },
  { label: "Courses", href: "/courses" },
];

const moreLinks = [
  { label: "Submit Idea", href: "/submit-idea" },
  { label: "Idea Lab", href: "/ideas" },
  { label: "Patents", href: "/patents" },
  { label: "Investors", href: "/investors" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const NavItem = ({ href, label }: { href: string; label: string }) => (
    <Link to={href} className="text-muted-foreground hover:text-foreground font-medium transition-colors text-sm">
      {label}
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src={logo} alt="Innvo Spark Guidance" className="w-full h-full object-contain" />
            </div>
            <span className="text-foreground">Innvo Spark</span>
            <span className="text-gradient-warm">Guidance</span>
          </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavItem key={link.label} {...link} />
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground font-medium transition-colors text-sm flex items-center gap-1">
              More <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {moreLinks.map((link) => (
                <DropdownMenuItem key={link.label} asChild>
                  <Link to={link.href} className="cursor-pointer">{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="max-w-[120px] truncate">{user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Log in</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {[...navLinks, ...moreLinks].map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-muted-foreground hover:text-foreground font-medium py-2"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 pt-2">
                {user ? (
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="flex-1" asChild>
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>Log in</Link>
                    </Button>
                    <Button variant="hero" size="sm" className="flex-1" asChild>
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
