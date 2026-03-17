import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Camera, Plus, Check, Loader2, X, AlertTriangle, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { categories, foods, type Food } from "@/data/foodDatabase";


type DetectedFood = {
  detected: boolean;
  food_name: string;
  portion_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: string;
  region: string;
  is_safe: boolean;
  warnings: string[];
  healthier_alternative: string;
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const MealsPage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [addedFoods, setAddedFoods] = useState<string[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectedFood, setDetectedFood] = useState<DetectedFood | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const filtered = foods.filter(
    (f) =>
      (activeCategory === "All" || f.region === activeCategory) &&
      f.name.toLowerCase().includes(search.toLowerCase())
  );

  const addFoodToLog = async (food: Food | { name: string; cal: number; protein: string | number; carbs: string | number; fat: string | number; region?: string }) => {
    if (!user) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("meal_logs").insert({
      user_id: user.id,
      date: today,
      meal_type: "Snack",
      food_items: food.name,
      calories: food.cal,
      protein: typeof food.protein === "string" ? parseInt(food.protein) : food.protein,
      carbs: typeof food.carbs === "string" ? parseInt(food.carbs) : food.carbs,
      fat: typeof food.fat === "string" ? parseFloat(String(food.fat)) : food.fat,
    } as any);
    setAddedFoods((prev) => [...prev, food.name]);
    toast({ title: `${food.name} added! 🍽️` });
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Full = ev.target?.result as string;
      setPreviewImage(base64Full);
      const base64 = base64Full.split(",")[1];
      setDetecting(true);
      setDetectedFood(null);
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-food`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64, userProfile: profile }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Detection failed" }));
          throw new Error(err.error);
        }
        const data = await resp.json();
        if (data.detected) setDetectedFood(data);
        else toast({ title: "Couldn't identify the food", description: "Try a clearer photo", variant: "destructive" });
      } catch (err: any) {
        toast({ title: "Detection Error", description: err.message, variant: "destructive" });
      } finally {
        setDetecting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const addDetectedFood = () => {
    if (!detectedFood) return;
    addFoodToLog({
      name: detectedFood.food_name,
      cal: detectedFood.calories,
      protein: detectedFood.protein,
      carbs: detectedFood.carbs,
      fat: detectedFood.fat,
      region: detectedFood.region,
    });
    setDetectedFood(null);
    setPreviewImage(null);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 lg:p-10 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-1">Meal Log</h1>
          <p className="text-sm text-muted-foreground mb-5">Search foods or snap a photo 📸</p>

          {/* Search + Camera */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Input
                placeholder="Search Indian, Continental, Street food..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                className="gradient-accent text-accent-foreground flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={detecting}
              >
                {detecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </Button>
            </motion.div>
          </div>

          {/* AI Detection Result */}
          <AnimatePresence>
            {(previewImage || detectedFood) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card rounded-2xl p-4 mb-5 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Camera className="w-4 h-4 text-accent" /> AI Food Detection
                  </h3>
                  <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => { setPreviewImage(null); setDetectedFood(null); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {previewImage && <img src={previewImage} alt="Food" className="w-full h-40 object-cover rounded-xl mb-3" />}
                {detecting && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your food...
                  </div>
                )}
                {detectedFood && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-lg font-bold text-foreground">{detectedFood.food_name}</p>
                      <p className="text-xs text-muted-foreground">{detectedFood.portion_size} • {detectedFood.confidence}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Cal", val: detectedFood.calories, cls: "text-accent", bg: "bg-accent/10" },
                        { label: "Protein", val: `${detectedFood.protein}g`, cls: "text-primary", bg: "bg-primary/10" },
                        { label: "Carbs", val: `${detectedFood.carbs}g`, cls: "text-foreground", bg: "bg-secondary" },
                        { label: "Fat", val: `${detectedFood.fat}g`, cls: "text-foreground", bg: "bg-secondary" },
                      ].map((s) => (
                        <div key={s.label} className={`text-center p-2 rounded-lg ${s.bg}`}>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className={`font-bold text-sm ${s.cls}`}>{s.val}</p>
                        </div>
                      ))}
                    </div>
                    {detectedFood.warnings?.length > 0 && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-destructive">{detectedFood.warnings.join(". ")}</div>
                      </div>
                    )}
                    {detectedFood.healthier_alternative && (
                      <p className="text-xs text-primary">💡 {detectedFood.healthier_alternative}</p>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={addDetectedFood} className="flex-1 gradient-primary text-primary-foreground">
                        <Check className="w-4 h-4 mr-1" /> Confirm & Add
                      </Button>
                      <Button variant="outline" onClick={() => { setDetectedFood(null); setPreviewImage(null); }}>
                        Wrong? Retry
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
            {categories.map((c) => (
              <motion.button
                key={c}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(c)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === c ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {c}
              </motion.button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-3">{filtered.length} items found</p>

          {/* Food List */}
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
            {filtered.map((f) => {
              const isAdded = addedFoods.includes(f.name);
              const showRecipe = expandedRecipe === f.name;
              return (
                <motion.div key={f.name} variants={item} layout className="glass-card rounded-xl overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{f.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{f.region}</span>
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-accent font-semibold">{f.cal} cal</span>
                        <span className="text-[10px] text-primary">P: {f.protein}</span>
                        <span className="text-[10px] text-muted-foreground">C: {f.carbs}</span>
                        <span className="text-[10px] text-muted-foreground">F: {f.fat}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {f.recipe && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setExpandedRecipe(showRecipe ? null : f.name)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                        >
                          {showRecipe ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <BookOpen className="w-4 h-4 text-muted-foreground" />}
                        </motion.button>
                      )}
                      <motion.div whileTap={{ scale: 0.8 }}>
                        <Button
                          size="icon"
                          variant={isAdded ? "default" : "ghost"}
                          className={`w-8 h-8 ${isAdded ? "gradient-primary" : ""}`}
                          onClick={() => !isAdded && addFoodToLog(f)}
                          disabled={isAdded}
                        >
                          {isAdded ? <Check className="w-4 h-4 text-primary-foreground" /> : <Plus className="w-4 h-4 text-primary" />}
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Recipe */}
                  <AnimatePresence>
                    {showRecipe && f.recipe && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 flex items-start gap-2 border-t border-border/50">
                          <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">{f.recipe}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default MealsPage;
