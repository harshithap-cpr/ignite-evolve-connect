import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Loader2, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX,
  Edit3, Save, Presentation, ArrowLeft, Lightbulb, Mic, FileText,
  Target, TrendingUp, Users, Rocket, HandCoins, Sparkles, Download, Copy, ClipboardCheck,
} from "lucide-react";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

interface Slide {
  slide_number: number;
  title: string;
  subtitle?: string;
  bullets: string[];
  speaker_notes: string;
  slide_type: "title" | "problem" | "solution" | "market" | "traction" | "team" | "ask";
}

interface PitchDeckData {
  slides: Slide[];
  elevator_pitch: string;
  pitch_tips: string[];
}

const slideIcons: Record<string, React.ReactNode> = {
  title: <Sparkles className="w-8 h-8" />,
  problem: <Target className="w-8 h-8" />,
  solution: <Lightbulb className="w-8 h-8" />,
  market: <TrendingUp className="w-8 h-8" />,
  traction: <Rocket className="w-8 h-8" />,
  team: <Users className="w-8 h-8" />,
  ask: <HandCoins className="w-8 h-8" />,
};

const slideGradients: Record<string, string> = {
  title: "from-primary/20 to-accent/10",
  problem: "from-destructive/10 to-destructive/5",
  solution: "from-spark-teal/20 to-spark-teal/5",
  market: "from-spark-amber/20 to-spark-amber/5",
  traction: "from-primary/15 to-spark-coral/10",
  team: "from-spark-lavender/20 to-spark-lavender/5",
  ask: "from-primary/20 to-accent/15",
};

const PitchDeckPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pitchData, setPitchData] = useState<PitchDeckData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [editedSlides, setEditedSlides] = useState<Slide[]>([]);
  const [showElevatorPitch, setShowElevatorPitch] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [editedPitch, setEditedPitch] = useState("");

  const ideaData = location.state as {
    title: string;
    problemStatement: string;
    proposedSolution: string;
    analysis: any;
  } | null;

  useEffect(() => {
    if (ideaData) {
      generatePitchDeck();
    }
  }, []);

  const generatePitchDeck = async () => {
    if (!ideaData) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch-deck", {
        body: {
          title: ideaData.title,
          problem_statement: ideaData.problemStatement,
          proposed_solution: ideaData.proposedSolution,
          analysis: ideaData.analysis,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPitchData(data);
      setEditedSlides(data.slides);
      setEditedPitch(data.elevator_pitch);
      toast.success("Pitch deck generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate pitch deck");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSlideEdit = (index: number, field: keyof Slide, value: any) => {
    setEditedSlides((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleBulletEdit = (slideIdx: number, bulletIdx: number, value: string) => {
    setEditedSlides((prev) =>
      prev.map((s, i) =>
        i === slideIdx ? { ...s, bullets: s.bullets.map((b, j) => (j === bulletIdx ? value : b)) } : s
      )
    );
  };

  const addBullet = (slideIdx: number) => {
    setEditedSlides((prev) =>
      prev.map((s, i) => (i === slideIdx ? { ...s, bullets: [...s.bullets, "New point"] } : s))
    );
  };

  const removeBullet = (slideIdx: number, bulletIdx: number) => {
    setEditedSlides((prev) =>
      prev.map((s, i) => (i === slideIdx ? { ...s, bullets: s.bullets.filter((_, j) => j !== bulletIdx) } : s))
    );
  };

  const exportToPDF = useCallback(() => {
    if (!editedSlides.length) return;
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    const margin = 60;
    const contentW = w - margin * 2;

    editedSlides.forEach((slide, idx) => {
      if (idx > 0) pdf.addPage();

      // Background
      pdf.setFillColor(245, 245, 250);
      pdf.rect(0, 0, w, h, "F");

      // Slide number badge
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 140);
      pdf.text(`Slide ${slide.slide_number} — ${slide.slide_type.toUpperCase()}`, margin, 40);

      // Title
      pdf.setFontSize(28);
      pdf.setTextColor(30, 30, 40);
      pdf.text(slide.title, margin, 80, { maxWidth: contentW });

      // Subtitle
      let y = 110;
      if (slide.subtitle) {
        pdf.setFontSize(14);
        pdf.setTextColor(100, 100, 120);
        const subtitleLines = pdf.splitTextToSize(slide.subtitle, contentW);
        pdf.text(subtitleLines, margin, y);
        y += subtitleLines.length * 18 + 10;
      }

      // Bullets
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 65);
      slide.bullets.forEach((bullet) => {
        const lines = pdf.splitTextToSize(`•  ${bullet}`, contentW - 20);
        if (y + lines.length * 16 > h - 80) return; // prevent overflow
        pdf.text(lines, margin + 10, y);
        y += lines.length * 16 + 8;
      });

      // Speaker notes at bottom
      if (slide.speaker_notes) {
        const notesY = h - 60;
        pdf.setDrawColor(200, 200, 210);
        pdf.line(margin, notesY - 15, w - margin, notesY - 15);
        pdf.setFontSize(9);
        pdf.setTextColor(140, 140, 155);
        const noteLines = pdf.splitTextToSize(`Notes: ${slide.speaker_notes}`, contentW);
        pdf.text(noteLines.slice(0, 2), margin, notesY);
      }
    });

    // Elevator pitch as last page
    if (editedPitch) {
      pdf.addPage();
      pdf.setFillColor(245, 245, 250);
      pdf.rect(0, 0, w, h, "F");
      pdf.setFontSize(24);
      pdf.setTextColor(30, 30, 40);
      pdf.text("1-Minute Elevator Pitch", margin, 70);
      pdf.setFontSize(13);
      pdf.setTextColor(50, 50, 65);
      const pitchLines = pdf.splitTextToSize(editedPitch, contentW);
      pdf.text(pitchLines, margin, 110);
    }

    pdf.save(`${ideaData?.title || "pitch-deck"}.pdf`);
    toast.success("PDF downloaded!");
  }, [editedSlides, editedPitch, ideaData]);

  const speakText = useCallback((text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isPresenting || !pitchData) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, editedSlides.length - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        setIsPresenting(false);
      }
    },
    [isPresenting, pitchData, editedSlides.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!ideaData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Presentation className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">No Idea Data</h1>
          <p className="text-muted-foreground mb-6">Submit an idea first to generate a pitch deck.</p>
          <Button variant="hero" onClick={() => navigate("/submit-idea")}>Submit an Idea</Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Fullscreen presentation mode
  if (isPresenting && editedSlides.length > 0) {
    const slide = editedSlides[currentSlide];
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className={`w-full max-w-4xl bg-gradient-to-br ${slideGradients[slide.slide_type]} rounded-3xl border border-border p-12 shadow-warm`}
          >
            <div className="flex items-center gap-3 mb-2 text-primary">
              {slideIcons[slide.slide_type]}
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Slide {slide.slide_number}
              </span>
            </div>
            <h2 className="font-display text-4xl font-bold text-foreground mb-2">{slide.title}</h2>
            {slide.subtitle && <p className="text-xl text-muted-foreground mb-8">{slide.subtitle}</p>}
            <ul className="space-y-4 mt-8">
              {slide.bullets.map((b, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  className="flex gap-3 text-lg text-card-foreground"
                >
                  <span className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                  {b}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
        <div className="p-4 flex items-center justify-between bg-card/80 backdrop-blur border-t border-border">
          <Button variant="ghost" onClick={() => setIsPresenting(false)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Exit
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} / {editedSlides.length} — Use ← → arrows or Space
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" disabled={currentSlide === 0} onClick={() => setCurrentSlide((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={currentSlide === editedSlides.length - 1} onClick={() => setCurrentSlide((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Pitch Deck</h1>
            <p className="text-muted-foreground mt-1">{ideaData.title}</p>
          </div>
          {pitchData && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowElevatorPitch(!showElevatorPitch)}>
                <Mic className="w-4 h-4 mr-1" /> Elevator Pitch
              </Button>
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-1" /> Export PDF
              </Button>
              <Button variant="hero" onClick={() => { setCurrentSlide(0); setIsPresenting(true); }}>
                <Presentation className="w-4 h-4 mr-1" /> Present
              </Button>
            </div>
          )}
        </div>

        {/* Generating State */}
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-20">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <Sparkles className="w-6 h-6 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mt-6">Crafting Your Pitch Deck...</h2>
            <p className="text-muted-foreground mt-2">AI is generating slides and your elevator pitch</p>
          </motion.div>
        )}

        {/* Elevator Pitch Section */}
        <AnimatePresence>
          {showElevatorPitch && pitchData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-primary" />
                    <h2 className="font-display font-bold text-lg text-card-foreground">1-Minute Elevator Pitch</h2>
                  </div>
                  <Button
                    variant={isSpeaking ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => speakText(editedPitch)}
                  >
                    {isSpeaking ? <><VolumeX className="w-4 h-4 mr-1" /> Stop</> : <><Volume2 className="w-4 h-4 mr-1" /> Listen</>}
                  </Button>
                </div>
                <Textarea
                  value={editedPitch}
                  onChange={(e) => setEditedPitch(e.target.value)}
                  className="min-h-[120px] text-sm leading-relaxed bg-secondary/30 border-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  ~{Math.round(editedPitch.split(/\s+/).length / 2.5)}s reading time • Edit the text above to customize
                </p>

                {/* Pitch Tips */}
                {pitchData.pitch_tips && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-xl">
                    <h3 className="font-display font-semibold text-sm text-card-foreground mb-2 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4 text-spark-amber" /> Delivery Tips
                    </h3>
                    <ul className="space-y-1">
                      {pitchData.pitch_tips.map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary font-bold">•</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slides Editor */}
        {pitchData && !isGenerating && (
          <div className="space-y-6">
            {/* Slide Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {editedSlides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`shrink-0 w-28 h-16 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-0.5 text-xs ${
                    currentSlide === i
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <span className="text-[10px] font-bold">{i + 1}</span>
                  <span className="truncate w-20 text-center">{slide.title}</span>
                </button>
              ))}
            </div>

            {/* Current Slide Editor */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-gradient-to-br ${slideGradients[editedSlides[currentSlide]?.slide_type || "title"]} rounded-2xl border border-border overflow-hidden`}
              >
                <div className="p-8">
                  {/* Slide Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="text-primary">{slideIcons[editedSlides[currentSlide]?.slide_type || "title"]}</div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background/50 px-2 py-1 rounded">
                        Slide {currentSlide + 1} — {editedSlides[currentSlide]?.slide_type}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSlide(editingSlide === currentSlide ? null : currentSlide)}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      {editingSlide === currentSlide ? "Done" : "Edit"}
                    </Button>
                  </div>

                  {/* Title */}
                  {editingSlide === currentSlide ? (
                    <Input
                      value={editedSlides[currentSlide].title}
                      onChange={(e) => handleSlideEdit(currentSlide, "title", e.target.value)}
                      className="text-2xl font-display font-bold mb-2 bg-background/50"
                    />
                  ) : (
                    <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                      {editedSlides[currentSlide]?.title}
                    </h2>
                  )}

                  {/* Subtitle */}
                  {editingSlide === currentSlide ? (
                    <Input
                      value={editedSlides[currentSlide].subtitle || ""}
                      onChange={(e) => handleSlideEdit(currentSlide, "subtitle", e.target.value)}
                      placeholder="Subtitle (optional)"
                      className="mb-6 bg-background/50"
                    />
                  ) : (
                    editedSlides[currentSlide]?.subtitle && (
                      <p className="text-lg text-muted-foreground mb-6">{editedSlides[currentSlide].subtitle}</p>
                    )
                  )}

                  {/* Bullets */}
                  <ul className="space-y-3 mt-6">
                    {editedSlides[currentSlide]?.bullets.map((b, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                        {editingSlide === currentSlide ? (
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={b}
                              onChange={(e) => handleBulletEdit(currentSlide, i, e.target.value)}
                              className="bg-background/50"
                            />
                            <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => removeBullet(currentSlide, i)}>×</Button>
                          </div>
                        ) : (
                          <span className="text-card-foreground">{b}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {editingSlide === currentSlide && (
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => addBullet(currentSlide)}>
                      + Add Bullet
                    </Button>
                  )}

                  {/* Speaker Notes */}
                  <div className="mt-8 p-4 bg-background/50 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-bold uppercase text-muted-foreground">Speaker Notes</span>
                    </div>
                    {editingSlide === currentSlide ? (
                      <Textarea
                        value={editedSlides[currentSlide].speaker_notes}
                        onChange={(e) => handleSlideEdit(currentSlide, "speaker_notes", e.target.value)}
                        className="bg-transparent border-none text-sm"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{editedSlides[currentSlide]?.speaker_notes}</p>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <div className="px-8 py-4 bg-background/30 flex items-center justify-between border-t border-border/50">
                  <Button variant="outline" size="sm" disabled={currentSlide === 0} onClick={() => setCurrentSlide((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentSlide + 1} of {editedSlides.length}
                  </span>
                  <Button variant="outline" size="sm" disabled={currentSlide === editedSlides.length - 1} onClick={() => setCurrentSlide((p) => p + 1)}>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Regenerate */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={generatePitchDeck} disabled={isGenerating}>
                <Sparkles className="w-4 h-4 mr-1" /> Regenerate Pitch Deck
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PitchDeckPage;
