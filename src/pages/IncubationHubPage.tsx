import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUsageGate } from "@/hooks/use-usage-gate";
import PaywallBanner from "@/components/PaywallBanner";
import { toast } from "sonner";
import {
  Building2, MapPin, Clock, Banknote, Percent, Search,
  CheckCircle2, Wifi, FlaskConical, Users, Rocket,
  ChevronDown, ChevronUp, Copy, Download, Sparkles,
  Send, ExternalLink, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Incubator {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  website_url: string | null;
  image_url: string | null;
  focus_areas: string[];
  facilities: string[];
  application_deadline: string | null;
  program_duration: string | null;
  equity_requirement: string | null;
  funding_support: string | null;
  is_active: boolean;
}

interface Idea {
  id: string;
  title: string;
  problem_statement: string | null;
  proposed_solution: string | null;
}

const facilityIcons: Record<string, React.ReactNode> = {
  "Co-working Space": <Users className="w-4 h-4" />,
  "High-speed Internet": <Wifi className="w-4 h-4" />,
  "Prototyping Lab": <FlaskConical className="w-4 h-4" />,
  "Hardware Lab": <FlaskConical className="w-4 h-4" />,
  "Research Lab": <FlaskConical className="w-4 h-4" />,
};

const IncubationHubPage = () => {
  const { user } = useAuth();
  const [incubators, setIncubators] = useState<Incubator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [focusFilter, setFocusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [registerDialog, setRegisterDialog] = useState<Incubator | null>(null);
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState("");
  const [regMessage, setRegMessage] = useState("");
  const [elevatorPitch, setElevatorPitch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchIncubators();
    if (user) {
      fetchUserIdeas();
      fetchMyRegistrations();
    }
  }, [user]);

  const fetchIncubators = async () => {
    const { data } = await supabase.from("incubators").select("*").eq("is_active", true);
    setIncubators((data as Incubator[]) || []);
    setLoading(false);
  };

  const fetchUserIdeas = async () => {
    if (!user) return;
    const { data } = await supabase.from("ideas").select("id, title, problem_statement, proposed_solution").eq("user_id", user.id);
    setUserIdeas((data as Idea[]) || []);
  };

  const fetchMyRegistrations = async () => {
    if (!user) return;
    const { data } = await supabase.from("incubator_registrations").select("incubator_id").eq("user_id", user.id);
    setMyRegistrations(new Set((data || []).map((r: any) => r.incubator_id)));
  };

  const { canUse, remainingFree, isPaid, recordUsage } = useUsageGate("incubator_registration");

  const handleRegister = async () => {
    if (!user || !registerDialog) return;
    if (!canUse) { toast.error("Free registration limit reached. Please upgrade."); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("incubator_registrations").insert({
        user_id: user.id,
        incubator_id: registerDialog.id,
        idea_id: selectedIdeaId || null,
        elevator_pitch: elevatorPitch || null,
        message: regMessage || null,
      });
      if (error) throw error;
      await recordUsage();
      toast.success(`Registered for ${registerDialog.name}!`);
      setMyRegistrations((prev) => new Set([...prev, registerDialog.id]));
      setRegisterDialog(null);
      setSelectedIdeaId("");
      setRegMessage("");
      setElevatorPitch("");
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const allFocusAreas = [...new Set(incubators.flatMap((i) => i.focus_areas))].sort();

  const filtered = incubators.filter((inc) => {
    const matchSearch = !search || inc.name.toLowerCase().includes(search.toLowerCase()) ||
      inc.description?.toLowerCase().includes(search.toLowerCase()) ||
      inc.location?.toLowerCase().includes(search.toLowerCase());
    const matchFocus = !focusFilter || inc.focus_areas.includes(focusFilter);
    return matchSearch && matchFocus;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Building2 className="w-4 h-4" /> Incubation Hub
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">
            Find Your <span className="text-gradient-warm">Incubator</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse top incubators, explore their facilities, and apply with your startup idea and elevator pitch.
          </p>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search incubators by name, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={focusFilter} onValueChange={setFocusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Focus Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Focus Areas</SelectItem>
              {allFocusAreas.map((area) => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Incubator Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No incubators found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((inc, idx) => {
              const isExpanded = expandedId === inc.id;
              const isRegistered = myRegistrations.has(inc.id);
              return (
                <motion.div
                  key={inc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden shadow-warm hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-display text-xl font-bold text-card-foreground">{inc.name}</h3>
                            {inc.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {inc.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{inc.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {inc.focus_areas.map((area) => (
                            <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex gap-2">
                          {isRegistered ? (
                            <Button variant="outline" size="sm" disabled className="text-primary">
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Applied
                            </Button>
                          ) : (
                            <Button
                              variant="hero"
                              size="sm"
                              onClick={() => {
                                if (!user) { toast.error("Please sign in first"); return; }
                                setRegisterDialog(inc);
                              }}
                            >
                              <Send className="w-4 h-4 mr-1" /> Apply
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : inc.id)}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                        <div className="text-right text-xs text-muted-foreground space-y-1">
                          {inc.program_duration && (
                            <p className="flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> {inc.program_duration}</p>
                          )}
                          {inc.funding_support && (
                            <p className="flex items-center gap-1 justify-end"><Banknote className="w-3 h-3" /> {inc.funding_support}</p>
                          )}
                          {inc.equity_requirement && (
                            <p className="flex items-center gap-1 justify-end"><Percent className="w-3 h-3" /> {inc.equity_requirement}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-2 border-t border-border/50">
                          <h4 className="font-display font-semibold text-sm text-card-foreground mb-3">Facilities & Amenities</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {inc.facilities.map((f) => (
                              <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                                {facilityIcons[f] || <CheckCircle2 className="w-4 h-4 text-primary" />}
                                {f}
                              </div>
                            ))}
                          </div>
                          {inc.website_url && (
                            <a href={inc.website_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4">
                              <ExternalLink className="w-3 h-3" /> Visit Website
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Registration Dialog */}
      <Dialog open={!!registerDialog} onOpenChange={() => setRegisterDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Apply to {registerDialog?.name}</DialogTitle>
            <DialogDescription>
              Submit your startup idea and elevator pitch to apply for this incubator program.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Select Your Idea</label>
              <Select value={selectedIdeaId} onValueChange={setSelectedIdeaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a submitted idea" />
                </SelectTrigger>
                <SelectContent>
                  {userIdeas.length === 0 ? (
                    <SelectItem value="none" disabled>No ideas submitted yet</SelectItem>
                  ) : (
                    userIdeas.map((idea) => (
                      <SelectItem key={idea.id} value={idea.id}>{idea.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-foreground">Elevator Pitch</label>
                {elevatorPitch && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyToClipboard(elevatorPitch)}>
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                )}
              </div>
              <Textarea
                placeholder="Write a compelling 1-minute elevator pitch for your startup..."
                value={elevatorPitch}
                onChange={(e) => setElevatorPitch(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ~{Math.round((elevatorPitch.split(/\s+/).filter(Boolean).length) / 2.5)}s reading time
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Message to Incubator (optional)</label>
              <Textarea
                placeholder="Why are you a great fit for this program?"
                value={regMessage}
                onChange={(e) => setRegMessage(e.target.value)}
                className="min-h-[60px]"
              />
            </div>

            <Button variant="hero" className="w-full" onClick={handleRegister} disabled={submitting || !selectedIdeaId}>
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" /> Submitting...</>
              ) : (
                <><Rocket className="w-4 h-4 mr-1" /> Submit Application</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default IncubationHubPage;
