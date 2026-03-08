import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Trophy, Clock, Search } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Hackathon {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_team_size: number;
  prize_pool: string;
  difficulty: string;
  tags: string[];
  image_url: string;
  is_active: boolean;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-spark-teal/10 text-spark-teal border-spark-teal/20",
  intermediate: "bg-spark-amber/10 text-spark-amber border-spark-amber/20",
  advanced: "bg-spark-coral/10 text-spark-coral border-spark-coral/20",
};

const HackathonsPage = () => {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHackathons = async () => {
      const { data, error } = await supabase
        .from("hackathons")
        .select("*")
        .eq("is_active", true)
        .order("start_date", { ascending: true });
      if (!error && data) setHackathons(data as Hackathon[]);
      setLoading(false);
    };
    fetchHackathons();
  }, []);

  const handleRegister = async (hackathonId: string) => {
    if (!user) {
      toast.error("Please sign in to register");
      navigate("/auth");
      return;
    }
    const { error } = await supabase
      .from("hackathon_registrations")
      .insert({ hackathon_id: hackathonId, user_id: user.id });
    if (error) {
      if (error.code === "23505") toast.info("You're already registered!");
      else toast.error("Registration failed");
    } else {
      toast.success("Successfully registered! 🎉");
    }
  };

  const filtered = hackathons.filter((h) => {
    const matchesSearch = h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === "all" || h.difficulty === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Discover <span className="text-gradient-warm">Hackathons</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join exciting hackathons, build innovative solutions, and win prizes.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search hackathons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              {["all", "beginner", "intermediate", "advanced"].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading hackathons...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((hackathon, idx) => (
                <motion.div
                  key={hackathon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-warm transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-44 overflow-hidden">
                    <img
                      src={hackathon.image_url}
                      alt={hackathon.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className={difficultyColors[hackathon.difficulty]}>
                        {hackathon.difficulty}
                      </Badge>
                      {hackathon.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>

                    <h3 className="font-bold font-display text-lg mb-2 text-card-foreground">{hackathon.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{hackathon.description}</p>

                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(hackathon.start_date), "MMM d")} - {format(new Date(hackathon.end_date), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Team size: up to {hackathon.max_team_size}
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Prize: {hackathon.prize_pool}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Register by {format(new Date(hackathon.registration_deadline), "MMM d")}
                      </div>
                    </div>

                    <Button variant="hero" className="w-full" onClick={() => handleRegister(hackathon.id)}>
                      Register Now
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No hackathons found matching your search.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HackathonsPage;
