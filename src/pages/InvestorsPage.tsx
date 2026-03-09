import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Mail, Linkedin, Globe, Briefcase, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUsageGate } from "@/hooks/use-usage-gate";
import PaywallBanner from "@/components/PaywallBanner";

interface Investor {
  id: string;
  name: string;
  title: string;
  company: string;
  investor_type: string;
  focus_areas: string[];
  investment_range: string;
  portfolio_size: number;
  bio: string;
  avatar_url: string;
  email?: string;
  linkedin_url: string;
  website_url: string;
  location: string;
}

const typeColors: Record<string, string> = {
  angel: "bg-spark-amber/10 text-spark-amber border-spark-amber/20",
  vc: "bg-primary/10 text-primary border-primary/20",
  accelerator: "bg-spark-teal/10 text-spark-teal border-spark-teal/20",
  incubator: "bg-spark-lavender/10 text-spark-lavender border-spark-lavender/20",
  corporate: "bg-secondary text-secondary-foreground",
  government: "bg-spark-coral/10 text-spark-coral border-spark-coral/20",
};

const typeFilters = ["all", "angel", "vc", "accelerator", "incubator", "government"];

const InvestorsPage = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [connectMessage, setConnectMessage] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvestors = async () => {
      const { data, error } = await supabase
        .from("investors")
        .select("id, name, title, company, bio, avatar_url, focus_areas, investment_range, investor_type, is_active, linkedin_url, website_url, location, portfolio_size, user_id, created_at")
        .eq("is_active", true)
        .order("portfolio_size", { ascending: false });
      if (!error && data) setInvestors(data as Investor[]);
      setLoading(false);
    };
    fetchInvestors();
  }, []);

  const { canUse, remainingFree, isPaid, recordUsage } = useUsageGate("investor_connection");

  const handleConnect = async () => {
    if (!user) {
      toast.error("Please sign in to connect");
      navigate("/auth");
      return;
    }
    if (!canUse) { toast.error("Free connection limit reached. Please upgrade."); return; }
    if (!selectedInvestor) return;

    const { error } = await supabase.from("investor_connections").insert({
      investor_id: selectedInvestor.id,
      user_id: user.id,
      message: connectMessage,
    });

    if (error) {
      if (error.code === "23505") toast.info("You've already requested a connection!");
      else toast.error("Connection request failed");
    } else {
      await recordUsage();
      toast.success(`Connection request sent to ${selectedInvestor.name}! 🤝`);
      setSelectedInvestor(null);
      setConnectMessage("");
    }
  };

  const filtered = investors.filter((inv) => {
    const matchesSearch =
      inv.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.company.toLowerCase().includes(search.toLowerCase()) ||
      inv.focus_areas?.some((f) => f.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || inv.investor_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-3xl font-bold font-display mb-4">Investor Directory</h1>
          <p className="text-muted-foreground mb-6">Sign in to access investor profiles and connect with them</p>
          <Button variant="hero" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <PaywallBanner feature="investor connection" remainingFree={remainingFree} canUse={canUse} isPaid={isPaid} />
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Find <span className="text-gradient-warm">Investors</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Connect with angel investors, VCs, accelerators, and incubators to fund your startup.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, company, or focus area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {typeFilters.map((f) => (
                <Button key={f} variant={typeFilter === f ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(f)} className="capitalize">
                  {f === "vc" ? "VC" : f}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading investors...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((investor, idx) => (
                <motion.div
                  key={investor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-warm transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <img src={investor.avatar_url} alt={investor.name} className="w-14 h-14 rounded-xl object-cover" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold font-display text-card-foreground truncate">{investor.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{investor.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {investor.company}
                      </p>
                    </div>
                    <Badge variant="outline" className={`capitalize shrink-0 ${typeColors[investor.investor_type] || ""}`}>
                      {investor.investor_type === "vc" ? "VC" : investor.investor_type}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{investor.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {investor.focus_areas?.map((area) => (
                      <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {investor.location}
                    </div>
                    <div>💰 {investor.investment_range}</div>
                    <div>📊 {investor.portfolio_size} investments</div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="hero" size="sm" className="flex-1" onClick={() => setSelectedInvestor(investor)}>
                      <Send className="w-3 h-3 mr-1" /> Connect
                    </Button>
                    {investor.email && (
                      <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                        <a href={`mailto:${investor.email}`}><Mail className="w-4 h-4" /></a>
                      </Button>
                    )}
                    {investor.linkedin_url && (
                      <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                        <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer"><Linkedin className="w-4 h-4" /></a>
                      </Button>
                    )}
                    {investor.website_url && (
                      <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                        <a href={investor.website_url} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4" /></a>
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">No investors found matching your search.</div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedInvestor} onOpenChange={() => setSelectedInvestor(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Connect with {selectedInvestor?.name}</DialogTitle>
            <DialogDescription>Send a pitch message to introduce yourself and your startup idea.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <img src={selectedInvestor?.avatar_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className="font-semibold text-sm text-foreground">{selectedInvestor?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedInvestor?.company} • {selectedInvestor?.investment_range}</p>
              </div>
            </div>
            <div>
              <Label>Your Pitch Message</Label>
              <Textarea
                value={connectMessage}
                onChange={(e) => setConnectMessage(e.target.value)}
                placeholder="Hi! I'm building [your startup]. We solve [problem] for [audience]. I'd love to discuss how your expertise in [focus area] could help us grow..."
                className="mt-1.5 rounded-xl min-h-[120px]"
              />
            </div>
            <Button variant="hero" className="w-full" onClick={handleConnect}>
              Send Connection Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default InvestorsPage;
