import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Video, Search, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  expertise: string[];
  bio: string;
  avatar_url: string;
  hourly_rate: number;
  rating: number;
  total_sessions: number;
  is_available: boolean;
}

const DOMAINS = [
  "All Domains",
  "AI / Machine Learning",
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Cybersecurity",
  "Cloud Computing",
  "Blockchain",
  "IoT",
  "Product Management",
  "Entrepreneurship",
  "Marketing",
  "Finance",
  "Healthcare",
  "AgriTech",
  "EdTech",
];

const MentorsPage = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All Domains");
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [userDomain, setUserDomain] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMentors = async () => {
      const { data, error } = await supabase
        .from("mentors").select("*").eq("is_available", true).order("rating", { ascending: false });
      if (!error && data) setMentors(data as Mentor[]);
      setLoading(false);
    };
    fetchMentors();
  }, []);

  const handleBooking = async () => {
    if (!user) { toast.error("Please sign in to book"); navigate("/auth"); return; }
    if (!selectedMentor || !bookingDate) return;
    const { error } = await supabase.from("mentor_bookings").insert({
      mentor_id: selectedMentor.id, user_id: user.id,
      scheduled_at: new Date(bookingDate).toISOString(),
      notes: `${userDomain ? `[Domain: ${userDomain}] ` : ""}${bookingNotes}`,
    });
    if (error) toast.error("Booking failed. Try again.");
    else {
      toast.success(`Session booked with ${selectedMentor.name}! 🎉`);
      setSelectedMentor(null); setBookingDate(""); setBookingNotes(""); setUserDomain("");
    }
  };

  const filtered = mentors.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.expertise?.some((e) => e.toLowerCase().includes(search.toLowerCase())) ||
      m.company?.toLowerCase().includes(search.toLowerCase());
    const matchesDomain = selectedDomain === "All Domains" ||
      m.expertise?.some((e) => e.toLowerCase().includes(selectedDomain.toLowerCase().split(" / ")[0].toLowerCase()));
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Connect with <span className="text-gradient-warm">Mentors</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Select your domain and find the perfect mentor for your journey.
            </p>
          </div>

          {/* Domain Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedDomain === domain
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {domain}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search by name, expertise, or company..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading mentors...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No mentors found for "{selectedDomain}". Try a different domain.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((mentor, idx) => (
                <motion.div key={mentor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-warm transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-4 mb-4">
                    <img src={mentor.avatar_url} alt={mentor.name}
                      className="w-16 h-16 rounded-xl object-cover" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold font-display text-card-foreground truncate">{mentor.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{mentor.title}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <Briefcase className="w-3 h-3" /> {mentor.company}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {mentor.expertise?.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{mentor.bio}</p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-spark-amber fill-spark-amber" />
                      <span className="font-medium text-card-foreground">{mentor.rating}</span>
                      <span className="text-muted-foreground">({mentor.total_sessions} sessions)</span>
                    </div>
                    <span className="font-semibold text-card-foreground">₹{mentor.hourly_rate}/hr</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="hero" className="flex-1" onClick={() => setSelectedMentor(mentor)}>
                      Book Session
                    </Button>
                    <Button variant="outline" size="icon"><MessageSquare className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon"><Video className="w-4 h-4" /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedMentor} onOpenChange={() => setSelectedMentor(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Book a Session with {selectedMentor?.name}</DialogTitle>
            <DialogDescription>Select your domain and schedule your mentoring session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Your Domain / Area of Interest *</Label>
              <select
                value={userDomain} onChange={(e) => setUserDomain(e.target.value)}
                className="w-full mt-1.5 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select your domain...</option>
                {DOMAINS.filter((d) => d !== "All Domains").map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Date & Time *</Label>
              <Input type="datetime-local" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>What would you like to discuss?</Label>
              <Textarea value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Describe your project or questions..."
                className="mt-1.5 rounded-xl" />
            </div>
            <Button variant="hero" className="w-full" onClick={handleBooking} disabled={!bookingDate || !userDomain}>
              Confirm Booking — ₹{selectedMentor?.hourly_rate}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MentorsPage;
