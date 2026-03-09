import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionGate from "@/components/SubscriptionGate";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtime } from "@/hooks/use-realtime";
import {
  Search, Lightbulb, Calendar, MessageSquare, Bot, Send, CheckCircle, XCircle, Clock,
  TrendingUp, Star, Users, ArrowRight, Loader2, Sparkles
} from "lucide-react";

interface PublicIdea {
  id: string; title: string; problem_statement: string; proposed_solution: string;
  overall_score: number; innovation_score: number; feasibility_score: number;
  market_score: number; tags: string[]; stage: string; user_id: string;
}

interface Booking {
  id: string; user_id: string; scheduled_at: string; status: string;
  notes: string; duration_minutes: number; created_at: string;
}

interface AiMessage { role: "user" | "assistant"; content: string; }

const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<PublicIdea[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchData();
  }, [user]);

  // Realtime subscriptions
  useRealtime({ table: "ideas", onInsert: () => fetchData(), onUpdate: () => fetchData() });
  useRealtime({ table: "mentor_bookings", onInsert: () => fetchData(), onUpdate: () => fetchData() });

  const fetchData = async () => {
    setLoading(true);
    const [ideasRes, mentorRes] = await Promise.all([
      supabase.from("ideas").select("*").eq("is_public", true).order("overall_score", { ascending: false }).limit(50),
      supabase.from("mentors").select("*").eq("user_id", user!.id).single(),
    ]);
    if (ideasRes.data) setIdeas(ideasRes.data);
    if (mentorRes.data) {
      setMentorProfile(mentorRes.data);
      const bookingsRes = await supabase.from("mentor_bookings").select("*").eq("mentor_id", mentorRes.data.id).order("scheduled_at", { ascending: false });
      if (bookingsRes.data) setBookings(bookingsRes.data);
    }
    setLoading(false);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("mentor_bookings").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Booking ${status}`);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const askAi = async () => {
    if (!aiInput.trim()) return;
    const question = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { role: "user", content: question }]);
    setAiLoading(true);
    try {
      const context = ideas.slice(0, 5).map(i => `${i.title}: ${i.problem_statement}`).join("\n");
      const { data, error } = await supabase.functions.invoke("ai-guidance", {
        body: { question, role: "mentor", context },
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

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const statusIcon = (s: string) => s === "confirmed" ? <CheckCircle className="h-4 w-4 text-green-500" /> : s === "cancelled" ? <XCircle className="h-4 w-4 text-red-500" /> : <Clock className="h-4 w-4 text-amber-500" />;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mentor Dashboard</h1>
          <p className="text-muted-foreground mt-1">Guide startups, manage sessions & get AI-powered insights</p>
        </motion.div>

        <SubscriptionGate feature="mentor dashboard">
        <Tabs defaultValue="startups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="startups"><Lightbulb className="h-4 w-4 mr-1" />Startups</TabsTrigger>
            <TabsTrigger value="bookings"><Calendar className="h-4 w-4 mr-1" />Bookings{pendingBookings.length > 0 && <Badge variant="destructive" className="ml-1 text-xs">{pendingBookings.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="ai"><Bot className="h-4 w-4 mr-1" />AI Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="startups" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search startups by name, problem, or tags..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
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
                            <Badge variant="secondary">{idea.stage}</Badge>
                          </div>
                          <CardDescription className="line-clamp-2">{idea.problem_statement}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[
                              { label: "Innovation", score: idea.innovation_score, color: "text-blue-500" },
                              { label: "Feasibility", score: idea.feasibility_score, color: "text-green-500" },
                              { label: "Market", score: idea.market_score, color: "text-purple-500" },
                            ].map(s => (
                              <div key={s.label} className="text-center">
                                <div className={`text-lg font-bold ${s.color}`}>{s.score || 0}</div>
                                <div className="text-xs text-muted-foreground">{s.label}</div>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {idea.tags?.slice(0, 3).map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                          </div>
                          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate("/pitch-deck", { state: { title: idea.title, problem_statement: idea.problem_statement, proposed_solution: idea.proposed_solution } })}>
                            View Pitch Deck <ArrowRight className="h-3 w-3 ml-1" />
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

          <TabsContent value="bookings" className="space-y-4">
            {!mentorProfile ? (
              <Card><CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No mentor profile found. Create one from the Mentors page.</p>
                <Button className="mt-4" onClick={() => navigate("/mentors")}>Go to Mentors</Button>
              </CardContent></Card>
            ) : bookings.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bookings yet.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <motion.div key={b.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card>
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          {statusIcon(b.status)}
                          <div>
                            <p className="font-medium">{new Date(b.scheduled_at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                            <p className="text-sm text-muted-foreground">{b.duration_minutes} min • {b.notes || "No notes"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {b.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => updateBookingStatus(b.id, "confirmed")}><CheckCircle className="h-4 w-4 mr-1" />Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, "cancelled")}><XCircle className="h-4 w-4 mr-1" />Decline</Button>
                            </>
                          )}
                          {b.status !== "pending" && <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge>}
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
                <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" />AI Mentorship Guide</CardTitle>
                <CardDescription>Ask about mentoring strategies, startup evaluation, or market trends</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {aiMessages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ask me anything about mentoring startups!</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {["How to evaluate product-market fit?", "Key metrics for early-stage startups", "How to structure a mentoring session"].map(q => (
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
                <Input placeholder="Ask about mentoring, startups, strategies..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && askAi()} />
                <Button onClick={askAi} disabled={aiLoading || !aiInput.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        </SubscriptionGate>
      </div>
      <Footer />
    </div>
  );
};

export default MentorDashboard;
