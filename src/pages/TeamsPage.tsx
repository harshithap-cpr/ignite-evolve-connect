import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Users, Plus, MessageCircle, StickyNote, Send, ArrowLeft, Mic, MicOff,
  Lock, Globe, UserPlus, Trash2, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Team {
  id: string;
  name: string;
  description: string | null;
  is_open: boolean;
  created_by: string;
  max_members: number;
  created_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface Message {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

interface Note {
  id: string;
  team_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const TeamsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState("chat");

  // Create form
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formOpen, setFormOpen] = useState(true);

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const fetchTeams = useCallback(async () => {
    if (!user) return;
    // Fetch open teams
    const { data: openTeams } = await supabase
      .from("teams" as any).select("*").eq("is_open", true).order("created_at", { ascending: false });

    // Fetch my team memberships
    const { data: memberOf } = await supabase
      .from("team_members" as any).select("team_id").eq("user_id", user.id);

    const myTeamIds = (memberOf as any[] || []).map((m: any) => m.team_id);

    let myTeamsData: any[] = [];
    if (myTeamIds.length > 0) {
      const { data } = await supabase
        .from("teams" as any).select("*").in("id", myTeamIds).order("created_at", { ascending: false });
      myTeamsData = data as any[] || [];
    }

    setTeams((openTeams as any[] || []).filter((t: any) => !myTeamIds.includes(t.id)));
    setMyTeams(myTeamsData);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchTeams();
  }, [user, fetchTeams]);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { data, error } = await supabase
      .from("teams" as any).insert({ name: formName, description: formDesc, is_open: formOpen, created_by: user.id } as any)
      .select().single();
    if (error) { toast.error("Failed to create team"); return; }
    // Auto-join as admin
    await supabase.from("team_members" as any).insert({ team_id: (data as any).id, user_id: user.id, role: "admin" } as any);
    toast.success("Team created! 🚀");
    setShowCreate(false);
    setFormName(""); setFormDesc(""); setFormOpen(true);
    fetchTeams();
  };

  const joinTeam = async (teamId: string) => {
    if (!user) return;
    const { error } = await supabase.from("team_members" as any).insert({ team_id: teamId, user_id: user.id } as any);
    if (error) { toast.error("Failed to join team"); return; }
    toast.success("Joined team! 🎉");
    fetchTeams();
  };

  const leaveTeam = async (teamId: string) => {
    if (!user) return;
    await supabase.from("team_members" as any).delete().eq("team_id", teamId).eq("user_id", user.id);
    toast.success("Left team");
    setActiveTeam(null);
    fetchTeams();
  };

  // Open team workspace
  const openTeam = async (team: Team) => {
    setActiveTeam(team);
    setActiveTab("chat");
    await loadTeamData(team.id);
  };

  const loadTeamData = async (teamId: string) => {
    const [messagesRes, membersRes, notesRes] = await Promise.all([
      supabase.from("team_messages" as any).select("*").eq("team_id", teamId).order("created_at", { ascending: true }).limit(200),
      supabase.from("team_members" as any).select("*").eq("team_id", teamId),
      supabase.from("team_notes" as any).select("*").eq("team_id", teamId).order("updated_at", { ascending: false }),
    ]);
    setMessages(messagesRes.data as any[] || []);
    setMembers(membersRes.data as any[] || []);
    setNotes(notesRes.data as any[] || []);
  };

  // Realtime messages
  useEffect(() => {
    if (!activeTeam) return;
    const channel = supabase
      .channel(`team-${activeTeam.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_messages", filter: `team_id=eq.${activeTeam.id}` },
        (payload) => { setMessages((prev) => [...prev, payload.new as Message]); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTeam]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (content: string, type = "text") => {
    if (!user || !activeTeam || !content.trim()) return;
    await supabase.from("team_messages" as any).insert({
      team_id: activeTeam.id, user_id: user.id, content: content.trim(), message_type: type,
    } as any);
    setNewMessage("");
  };

  // Notes
  const createNote = async () => {
    if (!user || !activeTeam) return;
    const { data, error } = await supabase
      .from("team_notes" as any).insert({ team_id: activeTeam.id, user_id: user.id, title: "Untitled Note", content: "" } as any)
      .select().single();
    if (!error && data) {
      setNotes((prev) => [data as any, ...prev]);
      setActiveNote(data as any);
      setNoteTitle("Untitled Note");
      setNoteContent("");
    }
  };

  const saveNote = async () => {
    if (!activeNote) return;
    await supabase.from("team_notes" as any).update({ title: noteTitle, content: noteContent } as any).eq("id", activeNote.id);
    setNotes((prev) => prev.map((n) => n.id === activeNote.id ? { ...n, title: noteTitle, content: noteContent } : n));
    toast.success("Note saved");
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from("team_notes" as any).delete().eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (activeNote?.id === noteId) setActiveNote(null);
    toast.success("Note deleted");
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        await transcribeAudio(blob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Recording started 🎙️");
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    setMediaRecorder(null);
  };

  const transcribeAudio = async (blob: Blob) => {
    toast.info("Transcribing audio...");
    try {
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: blob,
      });
      if (error) throw error;
      const transcript = data?.text || "Unable to transcribe audio.";
      // Save as a message
      await sendMessage(`🎙️ Voice Recording Transcript:\n${transcript}`, "transcript");
      // Also create a note
      if (activeTeam && user) {
        await supabase.from("team_notes" as any).insert({
          team_id: activeTeam.id, user_id: user.id,
          title: `Recording — ${format(new Date(), "MMM d, h:mm a")}`,
          content: transcript,
        } as any);
        await loadTeamData(activeTeam.id);
      }
      toast.success("Audio transcribed and saved! ✅");
    } catch {
      toast.error("Transcription failed. The feature requires backend configuration.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-3xl font-bold font-display mb-4">Team Project Space</h1>
          <p className="text-muted-foreground mb-6">Sign in to create or join teams</p>
          <Button variant="hero" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Team workspace view
  if (activeTeam) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="pt-16 flex-1 flex flex-col">
          {/* Team header */}
          <div className="border-b border-border bg-card px-4 py-3">
            <div className="container mx-auto flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setActiveTeam(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-lg text-card-foreground">{activeTeam.name}</h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {activeTeam.is_open ? <><Globe className="w-2.5 h-2.5 mr-0.5" /> Open</> : <><Lock className="w-2.5 h-2.5 mr-0.5" /> Private</>}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{members.length} members</Badge>
                </div>
                {activeTeam.description && <p className="text-xs text-muted-foreground truncate">{activeTeam.description}</p>}
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => leaveTeam(activeTeam.id)}>
                Leave
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="border-b border-border bg-card/50 px-4">
                <div className="container mx-auto">
                  <TabsList className="bg-transparent h-10">
                    <TabsTrigger value="chat" className="gap-1.5 text-xs"><MessageCircle className="w-3.5 h-3.5" /> Chat</TabsTrigger>
                    <TabsTrigger value="notes" className="gap-1.5 text-xs"><StickyNote className="w-3.5 h-3.5" /> Notes</TabsTrigger>
                    <TabsTrigger value="members" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Members</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* CHAT */}
              <TabsContent value="chat" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-240px)]">
                  <div className="container mx-auto max-w-3xl space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                    {messages.map((msg) => {
                      const isMe = msg.user_id === user?.id;
                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-card-foreground"
                          }`}>
                            {!isMe && <p className="text-[10px] font-semibold opacity-70 mb-0.5">{msg.user_id.slice(0, 8)}</p>}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {format(new Date(msg.created_at), "h:mm a")}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                {/* Message input */}
                <div className="border-t border-border bg-card p-3">
                  <div className="container mx-auto max-w-3xl flex gap-2">
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="icon"
                      className="shrink-0 rounded-xl"
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="rounded-xl"
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(newMessage); } }}
                    />
                    <Button variant="hero" size="icon" className="shrink-0 rounded-xl" onClick={() => sendMessage(newMessage)}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* NOTES */}
              <TabsContent value="notes" className="flex-1 mt-0 data-[state=inactive]:hidden">
                <div className="container mx-auto max-w-4xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-card-foreground">Team Notes</h3>
                    <Button variant="hero" size="sm" onClick={createNote}><Plus className="w-3 h-3 mr-1" /> New Note</Button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Notes list */}
                    <div className="md:col-span-1 space-y-2 max-h-[60vh] overflow-y-auto">
                      {notes.map((note) => (
                        <div key={note.id}
                          onClick={() => { setActiveNote(note); setNoteTitle(note.title); setNoteContent(note.content); }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            activeNote?.id === note.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                          }`}>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-semibold text-sm text-card-foreground truncate">{note.title}</h4>
                            <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(note.updated_at), "MMM d, h:mm a")}</p>
                        </div>
                      ))}
                      {notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No notes yet</p>}
                    </div>

                    {/* Note editor */}
                    <div className="md:col-span-2">
                      {activeNote ? (
                        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                          <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
                            className="font-display font-bold text-lg border-0 p-0 h-auto focus-visible:ring-0" placeholder="Note title" />
                          <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                            className="min-h-[300px] rounded-xl resize-none" placeholder="Start writing..." />
                          <Button variant="hero" size="sm" onClick={saveNote}>Save Note</Button>
                        </div>
                      ) : (
                        <div className="text-center py-16 text-muted-foreground">
                          <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Select a note or create a new one</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* MEMBERS */}
              <TabsContent value="members" className="flex-1 mt-0 data-[state=inactive]:hidden">
                <div className="container mx-auto max-w-2xl p-4 space-y-3">
                  <h3 className="font-display font-bold text-card-foreground mb-2">Team Members ({members.length})</h3>
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {m.user_id.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-card-foreground">{m.user_id.slice(0, 8)}...</p>
                        <p className="text-[10px] text-muted-foreground">Joined {format(new Date(m.joined_at), "MMM d, yyyy")}</p>
                      </div>
                      <Badge variant={m.role === "admin" ? "default" : "secondary"} className="text-[10px] capitalize">{m.role}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  // Teams listing
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-display mb-2">
                Team <span className="text-gradient-warm">Project Space</span>
              </h1>
              <p className="text-muted-foreground text-lg">Form teams, discuss problems, and build together.</p>
            </div>
            <Button variant="hero" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create Team
            </Button>
          </div>

          {/* My Teams */}
          {myTeams.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display font-bold text-lg text-foreground mb-4">🏠 My Teams</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTeams.map((team, i) => (
                  <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => openTeam(team)}
                    className="bg-card rounded-2xl border border-border p-5 cursor-pointer hover:shadow-warm hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center text-primary-foreground font-bold">
                        {team.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold font-display text-card-foreground truncate group-hover:text-primary transition-colors">{team.name}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          {team.is_open ? <><Globe className="w-2.5 h-2.5 mr-0.5" /> Open</> : <><Lock className="w-2.5 h-2.5 mr-0.5" /> Private</>}
                        </Badge>
                      </div>
                    </div>
                    {team.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{team.description}</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Browse Open Teams */}
          <div>
            <h2 className="font-display font-bold text-lg text-foreground mb-4">🌐 Browse Open Teams</h2>
            {loading ? (
              <div className="text-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : teams.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-muted mx-auto mb-4" />
                <h3 className="font-display font-bold text-xl mb-2 text-foreground">No Open Teams</h3>
                <p className="text-muted-foreground mb-6">Be the first to create a team!</p>
                <Button variant="hero" onClick={() => setShowCreate(true)}>Create a Team</Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team, i) => (
                  <motion.div key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl border border-border p-5 hover:shadow-warm transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground font-bold">
                        {team.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold font-display text-card-foreground truncate">{team.name}</h3>
                        <Badge variant="outline" className="text-[10px]"><Globe className="w-2.5 h-2.5 mr-0.5" /> Open</Badge>
                      </div>
                    </div>
                    {team.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{team.description}</p>}
                    <Button variant="hero" size="sm" className="w-full" onClick={() => joinTeam(team.id)}>
                      <UserPlus className="w-3 h-3 mr-1" /> Join Team
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Create New Team</DialogTitle>
            <DialogDescription>Start a team to collaborate with others.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createTeam} className="space-y-4 mt-2">
            <div>
              <Label>Team Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. GreenTech Innovators" className="mt-1.5 rounded-xl" required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="What is your team working on?" className="mt-1.5 rounded-xl" />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-card-foreground">Open Team</p>
                <p className="text-xs text-muted-foreground">Anyone can discover and join</p>
              </div>
              <Switch checked={formOpen} onCheckedChange={setFormOpen} />
            </div>
            <Button variant="hero" type="submit" className="w-full">Create Team</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default TeamsPage;
