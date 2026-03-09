import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SubscriptionGate from "@/components/SubscriptionGate";
import { useRealtime } from "@/hooks/use-realtime";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Lightbulb, Link2, Bot, Send, CheckCircle, XCircle, Clock,
  TrendingUp, DollarSign, ArrowRight, Loader2, Sparkles, BarChart3, Target
} from "lucide-react";

interface PublicIdea {
  id: string; title: string; problem_statement: string; proposed_solution: string;
  overall_score: number; innovation_score: number; feasibility_score: number;
  market_score: number; tags: string[]; stage: string; user_id: string;
}

interface Connection {
  id: string; user_id: string; idea_id: string | null; message: string;
  status: string; created_at: string;
}

interface AiMessage { role: "user" | "assistant"; content: string; }

const InvestorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<PublicIdea[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [investorProfile, setInvestorProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchData();
  }, [user]);

  useRealtime({ table: "ideas", onInsert: () => fetchData(), onUpdate: () => fetchData() });
  useRealtime({ table: "investor_connections", onInsert: () => fetchData(), onUpdate: () => fetchData() });

  const fetchData = async () => {
    setLoading(true);
    const [ideasRes, investorRes] = await Promise.all([
      supabase.from("ideas").select("*").eq("is_public", true).order("overall_score", { ascending: false }).limit(50),
      supabase.from("investors").select("*").eq("user_id", user!.id).single(),
    ]);
    if (ideasRes.data) setIdeas(ideasRes.data);
    if (investorRes.data) {
      setInvestorProfile(investorRes.data);
      const connRes = await supabase.from("investor_connections").select("*").eq("investor_id", investorRes.data.id).order("created_at", { ascending: false });
      if (connRes.data) setConnections(connRes.data);
    }
    setLoading(false);
  };

  const updateConnectionStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("investor_connections").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Connection ${status}`);
    setConnections(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const askAi = async () => {
    if (!aiInput.trim()) return;
    const question = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { role: "user", content: question }]);
    setAiLoading(true);
    try {
      const context = ideas.slice(0, 5).map(i => `${i.title} (Score: ${i.overall_score}/10): ${i.problem_statement}`).join("\n");
      const { data, error } = await supabase.functions.invoke("ai-guidance", {
        body: { question, role: "investor", context },
      });
      if (error) throw error;
      setAiMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (e: any) {
      toast.error(e.message || "AI guidance failed");
      setAiMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally { setAiLoading(false); }
  };

  const filtered = ideas.filter(i =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.problem_statement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingConns = connections.filter(c => c.status === "pending");
  const statusIcon = (s: string) => s === "accepted" ? <CheckCircle className="h-4 w-4 text-green-500" /> : s === "rejected" ? <XCircle className="h-4 w-4 text-red-500" /> : <Clock className="h-4 w-4 text-amber-500" />;

  const getScoreColor = (score: number) => score >= 7 ? "text-green-500" : score >= 4 ? "text-amber-500" : "text-red-500";

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Investor Dashboard</h1>
          <p className="text-muted-foreground mt-1">Discover startups, manage deal flow & get AI-powered due diligence insights</p>
        </motion.div>

        <Tabs defaultValue="dealflow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="dealflow"><TrendingUp className="h-4 w-4 mr-1" />Deal Flow</TabsTrigger>
            <TabsTrigger value="connections"><Link2 className="h-4 w-4 mr-1" />Requests{pendingConns.length > 0 && <Badge variant="destructive" className="ml-1 text-xs">{pendingConns.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="ai"><Bot className="h-4 w-4 mr-1" />AI Advisor</TabsTrigger>
          </TabsList>

          <TabsContent value="dealflow" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, problem, domain..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filtered.map((idea, i) => (
                    <motion.div key={idea.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="h-full hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg line-clamp-1">{idea.title}</CardTitle>
                            <div className={`text-xl font-bold ${getScoreColor(idea.overall_score)}`}>{idea.overall_score || 0}<span className="text-xs text-muted-foreground">/10</span></div>
                          </div>
                          <CardDescription className="line-clamp-2">{idea.problem_statement}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[
                              { label: "Innovation", score: idea.innovation_score, icon: Sparkles },
                              { label: "Feasibility", score: idea.feasibility_score, icon: Target },
                              { label: "Market", score: idea.market_score, icon: BarChart3 },
                            ].map(s => (
                              <div key={s.label} className="text-center">
                                <s.icon className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
                                <div className={`text-sm font-bold ${getScoreColor(s.score)}`}>{s.score || 0}</div>
                                <div className="text-xs text-muted-foreground">{s.label}</div>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {idea.tags?.slice(0, 3).map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                          </div>
                          <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/pitch-deck", { state: { title: idea.title, problem_statement: idea.problem_statement, proposed_solution: idea.proposed_solution } })}>
                            Generate Pitch Deck <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {!loading && filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">No startups found matching your search.</p>}
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            {!investorProfile ? (
              <Card><CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No investor profile found. Create one from the Investors page.</p>
                <Button className="mt-4" onClick={() => navigate("/investors")}>Go to Investors</Button>
              </CardContent></Card>
            ) : connections.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No connection requests yet.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {connections.map(c => (
                  <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card>
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          {statusIcon(c.status)}
                          <div>
                            <p className="font-medium text-sm">{c.message || "Connection request"}</p>
                            <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {c.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => updateConnectionStatus(c.id, "accepted")}><CheckCircle className="h-4 w-4 mr-1" />Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => updateConnectionStatus(c.id, "rejected")}><XCircle className="h-4 w-4 mr-1" />Decline</Button>
                            </>
                          )}
                          {c.status !== "pending" && <Badge variant={c.status === "accepted" ? "default" : "secondary"}>{c.status}</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" />AI Investment Advisor</CardTitle>
                <CardDescription>Ask about due diligence, market analysis, or investment strategies</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {aiMessages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ask me anything about startup investing!</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {["Due diligence checklist for SaaS startups", "How to evaluate market size claims?", "Red flags in early-stage pitches"].map(q => (
                        <Button key={q} variant="outline" size="sm" onClick={() => { setAiInput(q); }}>{q}</Button>
                      ))}
                    </div>
                  </div>
                )}
                {aiMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-4 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
              </CardContent>
              <div className="p-4 border-t flex gap-2">
                <Input placeholder="Ask about investing, due diligence, trends..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && askAi()} />
                <Button onClick={askAi} disabled={aiLoading || !aiInput.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default InvestorDashboard;
