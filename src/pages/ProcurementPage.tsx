import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search, ShoppingCart, Cpu, Monitor, Cloud, Wrench, Package, Sparkles,
  ExternalLink, IndianRupee, Loader2, ArrowRight, Star, Zap, Tag
} from "lucide-react";

interface BuyLink {
  platform: string;
  url: string;
}

interface Product {
  name: string;
  category: string;
  description: string;
  estimated_price: string;
  priority: "essential" | "recommended" | "nice_to_have";
  buy_links: BuyLink[];
}

interface Recommendations {
  recommendations: Product[];
  total_budget_estimate: string;
  procurement_tips: string[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  dev_hardware: <Cpu className="w-5 h-5" />,
  software: <Cloud className="w-5 h-5" />,
  office_equipment: <Monitor className="w-5 h-5" />,
  iot_sensors: <Zap className="w-5 h-5" />,
  cloud_services: <Cloud className="w-5 h-5" />,
  prototyping: <Wrench className="w-5 h-5" />,
};

const categoryLabels: Record<string, string> = {
  dev_hardware: "Dev Hardware",
  software: "Software",
  office_equipment: "Office Equipment",
  iot_sensors: "IoT & Sensors",
  cloud_services: "Cloud Services",
  prototyping: "Prototyping",
};

const priorityStyles: Record<string, string> = {
  essential: "bg-destructive/10 text-destructive border-destructive/20",
  recommended: "bg-primary/10 text-primary border-primary/20",
  nice_to_have: "bg-muted text-muted-foreground border-border",
};

const platformLogos: Record<string, string> = {
  Amazon: "🛒",
  "Amazon.in": "🛒",
  Flipkart: "🛍️",
  JioMart: "🏪",
  Instamart: "⚡",
  Blinkit: "🟡",
  Meesho: "📦",
  Croma: "🔌",
};

const quickBuyPlatforms = [
  { name: "Amazon.in", baseUrl: "https://www.amazon.in/s?k=", icon: "🛒" },
  { name: "Flipkart", baseUrl: "https://www.flipkart.com/search?q=", icon: "🛍️" },
  { name: "JioMart", baseUrl: "https://www.jiomart.com/search/", icon: "🏪" },
  { name: "Croma", baseUrl: "https://www.croma.com/searchB?q=", icon: "🔌" },
];

const featuredProducts = [
  { name: "Raspberry Pi 5", category: "dev_hardware", price: "₹5,999", image: "🍓", tags: ["IoT", "Prototyping"] },
  { name: "Arduino Uno R4", category: "dev_hardware", price: "₹2,499", image: "🔧", tags: ["Electronics", "Beginner"] },
  { name: "MacBook Air M3", category: "office_equipment", price: "₹1,14,900", image: "💻", tags: ["Development", "Design"] },
  { name: "AWS Credits", category: "cloud_services", price: "₹7,000/mo", image: "☁️", tags: ["Cloud", "Hosting"] },
  { name: "Figma Pro", category: "software", price: "₹1,050/mo", image: "🎨", tags: ["Design", "UI/UX"] },
  { name: "3D Printer Ender-3", category: "prototyping", price: "₹18,999", image: "🖨️", tags: ["Hardware", "Prototyping"] },
  { name: "ESP32 Dev Kit", category: "iot_sensors", price: "₹499", image: "📡", tags: ["IoT", "WiFi"] },
  { name: "Logitech MX Keys", category: "office_equipment", price: "₹8,995", image: "⌨️", tags: ["Productivity", "Office"] },
];

const ProcurementPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [trlLevel, setTrlLevel] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "ai">("browse");

  const handleGetRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommend-products", {
        body: {
          trl_level: trlLevel,
          idea_title: ideaTitle,
          idea_description: ideaDescription,
          category: categoryFilter === "all" ? null : categoryFilter,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecommendations(data);
      toast.success("AI recommendations ready!");
    } catch (err: any) {
      toast.error(err.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = featuredProducts.filter((p) => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openSearch = (platform: { baseUrl: string }, query: string) => {
    window.open(`${platform.baseUrl}${encodeURIComponent(query)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Procurement Hub</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find and purchase hardware, software & tools for your startup across all major platforms
          </p>
        </motion.div>

        {/* Quick Search Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto mb-8">
          <div className="flex gap-2 items-center bg-card border border-border rounded-2xl p-2 shadow-sm">
            <Search className="w-5 h-5 text-muted-foreground ml-3" />
            <Input
              placeholder="Search for hardware, software, tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 text-base"
            />
            <div className="flex gap-1">
              {quickBuyPlatforms.map((platform) => (
                <Button
                  key={platform.name}
                  variant="ghost"
                  size="sm"
                  className="text-xs whitespace-nowrap"
                  onClick={() => openSearch(platform, searchQuery || "startup hardware")}
                  title={`Search on ${platform.name}`}
                >
                  <span className="text-base mr-1">{platform.icon}</span>
                  <span className="hidden sm:inline">{platform.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          <Button variant={activeTab === "browse" ? "default" : "outline"} onClick={() => setActiveTab("browse")} className="gap-2">
            <Package className="w-4 h-4" /> Browse Products
          </Button>
          <Button variant={activeTab === "ai" ? "default" : "outline"} onClick={() => setActiveTab("ai")} className="gap-2">
            <Sparkles className="w-4 h-4" /> AI Recommendations
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button variant={categoryFilter === "all" ? "secondary" : "ghost"} size="sm" onClick={() => setCategoryFilter("all")}>All</Button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button key={key} variant={categoryFilter === key ? "secondary" : "ghost"} size="sm"
              onClick={() => setCategoryFilter(key)} className="gap-1">
              {categoryIcons[key]} {label}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "browse" ? (
            <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Featured Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {filteredProducts.map((product, i) => (
                  <motion.div key={product.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="hover:shadow-md transition-shadow h-full">
                      <CardContent className="p-5">
                        <div className="text-4xl mb-3">{product.image}</div>
                        <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                        <div className="flex items-center gap-1 text-primary font-bold mb-2">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {product.price.replace("₹", "")}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          {quickBuyPlatforms.slice(0, 3).map((platform) => (
                            <Button key={platform.name} variant="outline" size="sm" className="flex-1 text-xs gap-1"
                              onClick={() => openSearch(platform, product.name)}>
                              {platform.icon}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No products match your search. Try the AI recommendations tab!</p>
                </div>
              )}

              {/* Platform Quick Links */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Shop by Platform</CardTitle>
                  <CardDescription>Browse startup essentials on all major Indian e-commerce platforms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: "Amazon.in", url: "https://www.amazon.in/s?k=startup+kit", icon: "🛒", desc: "Widest range of tech" },
                      { name: "Flipkart", url: "https://www.flipkart.com/search?q=developer+kit", icon: "🛍️", desc: "Great deals on electronics" },
                      { name: "JioMart", url: "https://www.jiomart.com/search/electronics", icon: "🏪", desc: "Competitive pricing" },
                      { name: "Croma", url: "https://www.croma.com/", icon: "🔌", desc: "Premium electronics" },
                      { name: "Instamart", url: "https://www.swiggy.com/instamart", icon: "⚡", desc: "Quick delivery essentials" },
                      { name: "Blinkit", url: "https://blinkit.com/", icon: "🟡", desc: "10-min office supplies" },
                      { name: "Meesho", url: "https://www.meesho.com/", icon: "📦", desc: "Budget-friendly options" },
                      { name: "Reliance Digital", url: "https://www.reliancedigital.in/", icon: "🏬", desc: "Trusted electronics" },
                    ].map((platform) => (
                      <a key={platform.name} href={platform.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                        <span className="text-2xl">{platform.icon}</span>
                        <div>
                          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{platform.name}</p>
                          <p className="text-xs text-muted-foreground">{platform.desc}</p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* AI Recommendation Form */}
              <Card className="max-w-2xl mx-auto mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> AI-Powered Procurement Advisor
                  </CardTitle>
                  <CardDescription>Get TRL-stage-specific product recommendations tailored to your startup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">TRL Level</label>
                      <Select value={trlLevel} onValueChange={setTrlLevel}>
                        <SelectTrigger><SelectValue placeholder="Select TRL" /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8,9].map(l => (
                            <SelectItem key={l} value={String(l)}>TRL {l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Idea Title</label>
                      <Input placeholder="e.g., Smart Water Monitor" value={ideaTitle} onChange={e => setIdeaTitle(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Idea Description</label>
                    <Input placeholder="Brief description of your startup idea..." value={ideaDescription} onChange={e => setIdeaDescription(e.target.value)} />
                  </div>
                  <Button onClick={handleGetRecommendations} disabled={loading} className="w-full gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? "Analyzing..." : "Get AI Recommendations"}
                  </Button>
                </CardContent>
              </Card>

              {/* AI Results */}
              {recommendations && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Budget Summary */}
                  <Card className="bg-primary/5 border-primary/20 max-w-2xl mx-auto">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Total Budget</p>
                        <p className="text-2xl font-bold text-primary">{recommendations.total_budget_estimate}</p>
                      </div>
                      <Star className="w-8 h-8 text-primary/30" />
                    </CardContent>
                  </Card>

                  {/* Recommended Products */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.recommendations.map((product, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="h-full">
                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {categoryIcons[product.category] || <Package className="w-5 h-5" />}
                                <span className="text-xs text-muted-foreground">{categoryLabels[product.category] || product.category}</span>
                              </div>
                              <Badge className={`text-xs ${priorityStyles[product.priority]}`}>{product.priority.replace("_", " ")}</Badge>
                            </div>
                            <h3 className="font-semibold text-foreground">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                            <p className="font-bold text-primary">{product.estimated_price}</p>
                            <div className="flex flex-wrap gap-1">
                              {product.buy_links.map((link, j) => (
                                <a key={j} href={link.url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="text-xs gap-1">
                                    {platformLogos[link.platform] || "🔗"} {link.platform}
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </a>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Procurement Tips */}
                  <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-primary" /> Procurement Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.procurement_tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary font-bold mt-0.5">•</span> {tip}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default ProcurementPage;
