import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ThumbsUp, Star, X, MessageSquare } from "lucide-react";

const AppFeedback = () => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from("app_feedback").select("rating, liked");
      if (data && data.length > 0) {
        setTotalLikes(data.filter((d: any) => d.liked).length);
        setAvgRating(+(data.reduce((sum: number, d: any) => sum + d.rating, 0) / data.length).toFixed(1));
      }
    };
    fetchStats();
  }, [submitted]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to rate");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    const { error } = await supabase.from("app_feedback").insert({
      user_id: user.id,
      rating,
      feedback: feedback || null,
      liked: rating >= 4,
    });

    if (error) {
      if (error.code === "23505") toast.error("You've already submitted feedback!");
      else toast.error("Failed to submit");
    } else {
      setSubmitted(true);
      toast.success("Thank you for your feedback! 🎉");
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
        title="Rate this app"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-50 bg-card border border-border rounded-2xl shadow-warm p-6 w-80"
          >
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            {!submitted ? (
              <>
                <h3 className="font-display font-bold text-lg text-card-foreground mb-1">Rate Spark Guidance</h3>
                <p className="text-xs text-muted-foreground mb-4">Help us improve by sharing your experience</p>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          s <= (hoverRating || rating)
                            ? "text-spark-amber fill-spark-amber"
                            : "text-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think... (optional)"
                  className="rounded-xl mb-3 text-sm min-h-[60px]"
                />

                <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={rating === 0}>
                  <ThumbsUp className="w-4 h-4 mr-1" /> Submit Rating
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="font-display font-bold text-card-foreground">Thank You!</h3>
                <p className="text-xs text-muted-foreground mt-1">Your feedback helps us improve</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-spark-amber fill-spark-amber" />
                <span>{avgRating || "—"} avg</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3 text-spark-teal" />
                <span>{totalLikes} likes</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppFeedback;
