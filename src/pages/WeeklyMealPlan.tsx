import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Loader2, ShoppingCart, ChevronDown, ChevronUp, Check, Utensils, Lightbulb, Plus, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Meal = {
  meal_type: string;
  food_items: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe_tip?: string;
  ingredients?: string[];
};

type Day = {
  day: string;
  meals: Meal[];
  day_total: { calories: number; protein: number };
};

type GroceryList = Record<string, string[]> | string[];

type MealPlan = {
  daily_calories_target: number;
  daily_protein_target: number;
  days: Day[];
  grocery_list: GroceryList;
  tips: string[];
};

const regions = ["Pan-Indian", "South Indian", "North Indian", "East Indian", "North-East Indian"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

// Check if a date falls within the current week (Mon-Sun)
const isCurrentWeek = (weekStart: string) => {
  const now = new Date();
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return now >= start && now <= end;
};

const WeeklyMealPlan = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [region, setRegion] = useState("Pan-Indian");
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [weekInfo, setWeekInfo] = useState<{ start: string; end: string } | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [showGrocery, setShowGrocery] = useState(false);
  const [checkedMeals, setCheckedMeals] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  // Load saved plan for current week on mount
  useEffect(() => {
    if (!user) { setLoadingSaved(false); return; }
    const loadSavedPlan = async () => {
      const { data } = await supabase
        .from("saved_meal_plans" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const plans = data as any[];
      if (plans && plans.length > 0) {
        const latest = plans[0];
        if (isCurrentWeek(latest.week_start)) {
          setPlan(latest.plan_data as MealPlan);
          setSavedPlanId(latest.id);
          setWeekInfo({ start: latest.week_start, end: latest.week_end });
          setRegion(latest.region || "Pan-Indian");
        }
      }
      setLoadingSaved(false);
    };
    loadSavedPlan();
  }, [user]);

  const generatePlan = async () => {
    if (!user) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }
    setLoading(true);
    setPlan(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-meal-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ userProfile: profile, region }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error);
      }
      const data: MealPlan = await resp.json();
      
      // Calculate week start (Monday) and end (Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const weekStart = monday.toISOString().split("T")[0];
      const weekEnd = sunday.toISOString().split("T")[0];

      // Save to database
      if (savedPlanId) {
        await supabase
          .from("saved_meal_plans" as any)
          .update({ plan_data: data as any, region, week_start: weekStart, week_end: weekEnd } as any)
          .eq("id", savedPlanId);
      } else {
        const { data: inserted } = await supabase
          .from("saved_meal_plans" as any)
          .insert({ user_id: user.id, plan_data: data as any, region, week_start: weekStart, week_end: weekEnd } as any)
          .select()
          .single();
        if (inserted) setSavedPlanId((inserted as any).id);
      }

      setPlan(data);
      setWeekInfo({ start: weekStart, end: weekEnd });
      setExpandedDay(0);
      setCheckedMeals(new Set());
      toast({ title: "Meal plan saved for this week! 📅" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleMeal = (dayIndex: number, mealIndex: number) => {
    const key = `${dayIndex}-${mealIndex}`;
    setCheckedMeals((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const addDayToMealLog = async (day: Day) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const inserts = day.meals.map((m) => ({
      user_id: user.id,
      date: today,
      meal_type: m.meal_type,
      food_items: m.food_items,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      is_complete: false,
    }));
    await supabase.from("meal_logs").insert(inserts as any);
    toast({ title: `${day.day}'s meals added to your log! 🍽️` });
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 lg:p-10 max-w-2xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Weekly Meal Plan</h1>
                <p className="text-sm text-muted-foreground">AI-powered, disease-aware, regional Indian meals</p>
              </div>
            </div>
          </motion.div>

          {/* Region Selector & Generate */}
          <motion.div variants={item} className="glass-card rounded-2xl p-5 mb-5">
            <label className="text-sm font-medium text-foreground mb-2 block">Select your preferred cuisine region</label>
            <div className="flex gap-3">
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => plan ? setShowConfirm(true) : generatePlan()} disabled={loading} className="gradient-primary text-primary-foreground">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : plan ? <RefreshCw className="w-4 h-4 mr-2" /> : <Utensils className="w-4 h-4 mr-2" />}
                {plan ? "New Plan" : "Generate"}
              </Button>
            </div>
            {profile?.diseases && profile.diseases.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">⚕️ Plan will be safe for: {profile.diseases.join(", ")}</p>
            )}
            {weekInfo && plan && (
              <div className="flex items-center gap-1.5 mt-2">
                <Lock className="w-3 h-3 text-primary" />
                <p className="text-xs text-primary font-medium">
                  🔒 Locked: {weekInfo.start} → {weekInfo.end} — stays fixed even after logout
                </p>
              </div>
            )}
          </motion.div>

          {/* Confirmation Dialog */}
          <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Replace current meal plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your current weekly plan and grocery list will be permanently replaced. This cannot be undone. Only do this if you don't like the current plan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Current Plan</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setShowConfirm(false); generatePlan(); }}>
                  Yes, Generate New Plan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Loading states */}
          {loadingSaved && (
            <div className="glass-card rounded-2xl p-8 text-center mb-5">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading your saved meal plan...</p>
            </div>
          )}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-8 text-center mb-5">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Creating your personalized meal plan...</p>
              <p className="text-xs text-muted-foreground mt-1">Considering your health profile, goals & preferences</p>
            </motion.div>
          )}

          {/* No plan yet */}
          {!loadingSaved && !loading && !plan && (
            <motion.div variants={item} className="glass-card rounded-2xl p-8 text-center">
              <Utensils className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No meal plan for this week yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Generate one above — it'll stay fixed until the week ends!</p>
            </motion.div>
          )}

          {/* Meal Plan */}
          <AnimatePresence>
            {plan && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Targets */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">Daily Calories</p>
                    <p className="text-2xl font-bold text-accent">{plan.daily_calories_target}</p>
                  </div>
                  <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">Daily Protein</p>
                    <p className="text-2xl font-bold text-primary">{plan.daily_protein_target}g</p>
                  </div>
                </div>

                {/* Days */}
                <div className="space-y-3 mb-5">
                  {plan.days.map((day, di) => (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: di * 0.05 }}
                      className="glass-card rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedDay(expandedDay === di ? null : di)}
                        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-foreground">{day.day}</span>
                          <span className="text-xs text-muted-foreground">{day.day_total?.calories || 0} cal</span>
                        </div>
                        {expandedDay === di ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>

                      <AnimatePresence>
                        {expandedDay === di && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-2">
                              {day.meals.map((meal, mi) => {
                                const isChecked = checkedMeals.has(`${di}-${mi}`);
                                return (
                                  <motion.div
                                    key={mi}
                                    className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                                      isChecked ? "bg-primary/10" : "bg-secondary/50"
                                    }`}
                                    onClick={() => toggleMeal(di, mi)}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                                      isChecked ? "bg-primary border-primary" : "border-muted-foreground/30"
                                    }`}>
                                      {isChecked && <Check className="w-3 h-3 text-primary-foreground" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-primary">{meal.meal_type}</p>
                                      <p className={`text-sm ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                        {meal.food_items}
                                      </p>
                                      <div className="flex gap-2 mt-1 flex-wrap">
                                        <span className="text-[10px] text-accent font-semibold">{meal.calories} cal</span>
                                        <span className="text-[10px] text-primary">P: {meal.protein}g</span>
                                        <span className="text-[10px] text-muted-foreground">C: {meal.carbs}g</span>
                                        <span className="text-[10px] text-muted-foreground">F: {meal.fat}g</span>
                                      </div>
                                      {meal.recipe_tip && (
                                        <p className="text-[10px] text-muted-foreground mt-1 italic">💡 {meal.recipe_tip}</p>
                                      )}
                                    </div>
                                  </motion.div>
                                );
                              })}
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-2 text-xs"
                                onClick={(e) => { e.stopPropagation(); addDayToMealLog(day); }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add {day.day}'s meals to today's log
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                {/* Grocery List */}
                {plan.grocery_list && (
                  <div className="glass-card rounded-2xl overflow-hidden mb-5">
                    <button
                      onClick={() => setShowGrocery(!showGrocery)}
                      className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Weekly Grocery List</span>
                      </div>
                      {showGrocery ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {showGrocery && (
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3">
                            {Array.isArray(plan.grocery_list) ? (
                              <div className="grid grid-cols-2 gap-1">
                                {plan.grocery_list.map((g, i) => (
                                  <p key={i} className="text-xs text-muted-foreground">• {g}</p>
                                ))}
                              </div>
                            ) : (
                              Object.entries(plan.grocery_list).map(([category, items]) => (
                                <div key={category}>
                                  <p className="text-xs font-semibold text-primary mb-1">🏷️ {category}</p>
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pl-2">
                                    {(items as string[]).map((item, i) => (
                                      <p key={i} className="text-xs text-muted-foreground">• {item}</p>
                                    ))}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Tips */}
                {plan.tips && plan.tips.length > 0 && (
                  <div className="glass-card rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold text-foreground">Tips for You</span>
                    </div>
                    <div className="space-y-2">
                      {plan.tips.map((tip, i) => (
                        <p key={i} className="text-xs text-muted-foreground">✨ {tip}</p>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default WeeklyMealPlan;
