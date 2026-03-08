import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, BookOpen, Search, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  difficulty: string;
  duration_hours: number;
  lessons_count: number;
  image_url: string;
  is_premium: boolean;
  avg_rating: number;
  total_ratings: number;
  video_url: string | null;
}

const diffColors: Record<string, string> = {
  beginner: "bg-spark-teal/10 text-spark-teal border-spark-teal/20",
  intermediate: "bg-spark-amber/10 text-spark-amber border-spark-amber/20",
  advanced: "bg-spark-coral/10 text-spark-coral border-spark-coral/20",
};

const categories = ["All", "Innovation", "Entrepreneurship", "Technology", "Product", "Soft Skills"];

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [ratingCourse, setRatingCourse] = useState<Course | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("avg_rating", { ascending: false });
      if (!error && data) setCourses(data as Course[]);
      setLoading(false);
    };
    fetchCourses();
  }, []);

  const handleRate = async () => {
    if (!user || !ratingCourse || userRating === 0) {
      toast.error("Please sign in and select a rating");
      return;
    }
    const { error } = await supabase.from("course_ratings").upsert(
      { course_id: ratingCourse.id, user_id: user.id, rating: userRating, review: userReview },
      { onConflict: "course_id,user_id" }
    );
    if (error) toast.error("Failed to submit rating");
    else {
      toast.success("Rating submitted! ⭐");
      setRatingCourse(null);
      setUserRating(0);
      setUserReview("");
    }
  };

  const filtered = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || c.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
              Learn & <span className="text-gradient-warm">Grow</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Courses designed for innovators — from design thinking to blockchain development.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading courses...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-warm transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    {course.is_premium && (
                      <div className="absolute top-3 right-3 bg-gradient-warm text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Premium
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={diffColors[course.difficulty]}>{course.difficulty}</Badge>
                      <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                    </div>

                    <h3 className="font-bold font-display text-card-foreground mb-1 line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">by {course.instructor}</p>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {course.duration_hours}h
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {course.lessons_count} lessons
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-spark-amber fill-spark-amber" />
                        {course.avg_rating} ({course.total_ratings})
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="hero" size="sm" className="flex-1">
                        {course.is_premium ? "Unlock" : "Start Learning"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setRatingCourse(course); setUserRating(0); setUserReview(""); }}>
                        <Star className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!ratingCourse} onOpenChange={() => setRatingCourse(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Rate: {ratingCourse?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setUserRating(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${(hoverRating || userRating) >= s ? "text-spark-amber fill-spark-amber" : "text-muted"}`}
                  />
                </button>
              ))}
            </div>
            <div>
              <Label>Your Review (optional)</Label>
              <Textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                placeholder="Share your thoughts about this course..."
                className="mt-1.5 rounded-xl"
              />
            </div>
            <Button variant="hero" className="w-full" onClick={handleRate} disabled={userRating === 0}>
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CoursesPage;
