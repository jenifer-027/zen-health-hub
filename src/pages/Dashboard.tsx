import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Flame, Dumbbell, Moon, Footprints, MessageCircle, Check, Plus, Minus, AlertTriangle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHabitReminders } from "@/hooks/useHabitReminders";
import { useStepCounter } from "@/hooks/useStepCounter";

const defaultMeals = [
  { meal_type: "Breakfast", food_items: "Idli + Sambar + Coffee", calories: 320, protein: 12, carbs: 48, fat: 6 },
  { meal_type: "Lunch", food_items: "Dal, Rice, Sabzi, Curd", calories: 520, protein: 18, carbs: 72, fat: 14 },
  { meal_type: "Snack", food_items: "Sprouts Chaat + Green Tea", calories: 180, protein: 10, carbs: 24, fat: 4 },
  { meal_type: "Dinner", food_items: "Roti + Paneer Curry + Salad", calories: 450, protein: 22, carbs: 48, fat: 16 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  useHabitReminders();
  const trackedSteps = useStepCounter(user?.id);
  const [meals, setMeals] = useState<any[]>([]);
  const [dailyLog, setDailyLog] = useState<any>(null);
  const [waterCount, setWaterCount] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [deficitAlert, setDeficitAlert] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const PROTEIN_TARGET = profile?.goal === "gain" ? 100 : profile?.goal === "lose" ? 80 : 75;
  const CAL_TARGET = profile?.goal === "lose" ? 1600 : profile?.goal === "gain" ? 2300 : 1800;

  useEffect(() => {
    if (!user) return;
    loadTodayData();
    calcStreak();
  }, [user]);

  const calcStreak = async () => {
    if (!user) return;
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("date, calories_consumed")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30);

    if (!logs || logs.length === 0) return;

    let count = 0;
    const sortedDates = logs.map((l) => l.date).sort().reverse();
    const todayDate = new Date();

    for (let i = 0; i < sortedDates.length; i++) {
      const logDate = new Date(sortedDates[i]);
      const expected = new Date(todayDate);
      expected.setDate(todayDate.getDate() - i);
      const expectedStr = expected.toISOString().split("T")[0];
      if (sortedDates[i] === expectedStr && (logs.find(l => l.date === sortedDates[i])?.calories_consumed || 0) > 0) {
        count++;
      } else {
        break;
      }
    }
    setStreak(count);
  };

  const loadTodayData = async () => {
    if (!user) return;

    const { data: log } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (log) {
      setDailyLog(log);
      setWaterCount(log.water_intake || 0);
      setSelectedMood(log.mood);
    } else {
      const { data: newLog } = await supabase
        .from("daily_logs")
        .insert({ user_id: user.id, date: today } as any)
        .select()
        .single();
      setDailyLog(newLog);
    }

    const { data: mealData } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at");

    if (mealData && mealData.length > 0) {
      setMeals(mealData);
      checkDeficit(mealData);
    } else {
      const toInsert = defaultMeals.map((m) => ({
        user_id: user.id,
        date: today,
        ...m,
        is_complete: false,
      }));
      const { data: seeded } = await supabase
        .from("meal_logs")
        .insert(toInsert as any)
        .select();
      setMeals(seeded || []);
    }
  };

  const checkDeficit = (mealList: any[]) => {
    const completedMealsList = mealList.filter((m) => m.is_complete);
    const doneProteins = completedMealsList.reduce((s: number, m: any) => s + (m.protein || 0), 0);
    const pendingMeals = mealList.filter((m) => !m.is_complete);

    if (completedMealsList.length > 0 && pendingMeals.length > 0) {
      const proteinGap = PROTEIN_TARGET - doneProteins;
      if (proteinGap > 15) {
        const nextMeal = pendingMeals[0]?.meal_type || "next meal";
        setDeficitAlert(`You need ${proteinGap}g more protein today — add paneer, eggs, or dal at ${nextMeal} 💪`);
      } else {
        setDeficitAlert(null);
      }
    }
  };

  const toggleMealComplete = async (mealId: string, current: boolean) => {
    await supabase.from("meal_logs").update({ is_complete: !current } as any).eq("id", mealId);
    const updatedMeals = meals.map((m) =>
      m.id === mealId ? { ...m, is_complete: !current } : m
    );
    setMeals(updatedMeals);

    const totalCal = updatedMeals.filter((m) => m.is_complete).reduce((s, m) => s + (m.calories || 0), 0);
    const totalProtein = updatedMeals.filter((m) => m.is_complete).reduce((s, m) => s + (m.protein || 0), 0);
    await supabase
      .from("daily_logs")
      .update({ calories_consumed: totalCal, protein_consumed: totalProtein } as any)
      .eq("id", dailyLog?.id);

    checkDeficit(updatedMeals);
  };

  const updateWater = async (delta: number) => {
    const next = Math.max(0, waterCount + delta);
    setWaterCount(next);
    if (dailyLog) {
      await supabase.from("daily_logs").update({ water_intake: next } as any).eq("id", dailyLog.id);
    }
  };

  const setMood = async (mood: string) => {
    setSelectedMood(mood);
    if (dailyLog) {
      await supabase.from("daily_logs").update({ mood } as any).eq("id", dailyLog.id);
    }
    toast({ title: `Mood saved ${mood}` });
  };

  const completedMeals = meals.filter((m) => m.is_complete);
  const totalCal = completedMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = completedMeals.reduce((s, m) => s + (m.protein || 0), 0);
  const calPct = Math.min(100, Math.round((totalCal / CAL_TARGET) * 100));
  const proteinPct = Math.min(100, Math.round((totalProtein / PROTEIN_TARGET) * 100));

  const stats = [
    { icon: Flame, label: "Calories", value: totalCal.toLocaleString(), target: `/ ${CAL_TARGET.toLocaleString()}`, color: "text-accent", bg: "bg-accent/10", pct: calPct },
    { icon: Dumbbell, label: "Protein", value: `${totalProtein}g`, target: `/ ${PROTEIN_TARGET}g`, color: "text-primary", bg: "bg-primary/10", pct: proteinPct },
    { icon: Droplets, label: "Water", value: `${waterCount}`, target: "/ 8 glasses", color: "text-ai", bg: "bg-ai/10", pct: Math.min(100, waterCount * 12.5) },
    { icon: Footprints, label: "Steps", value: dailyLog?.steps?.toLocaleString() || "0", target: "/ 8,000", color: "text-accent", bg: "bg-accent/10", pct: Math.min(100, ((dailyLog?.steps || 0) / 8000) * 100) },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-8 lg:p-10 max-w-4xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show">
          {/* Greeting */}
          <motion.div variants={item} className="mb-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {greeting()}, {profile?.name || "friend"}! 🌿
                </h1>
                <p className="text-sm text-muted-foreground">Let's make today count.</p>
              </div>
              {streak > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20"
                >
                  <Flame className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold text-accent">{streak} day streak!</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Smart Deficit Alert */}
          <AnimatePresence>
            {deficitAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                variants={item}
                className="glass-card rounded-2xl p-4 mb-5 border-l-4 border-accent flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Smart Meal Adjustment</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{deficitAlert}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Buddy Card */}
          <motion.div variants={item} className="glass-card rounded-2xl p-4 md:p-5 mb-5 border-l-4 border-ai" whileHover={{ scale: 1.01 }}>
            <div className="flex items-start gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl gradient-ai flex items-center justify-center flex-shrink-0"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <MessageCircle className="w-5 h-5 text-ai-foreground" />
              </motion.div>
              <div>
                <p className="text-sm font-medium text-foreground">Fitzen Buddy</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalProtein < PROTEIN_TARGET / 2
                    ? `You've had ${totalProtein}g protein so far — try adding paneer or dal at your next meal! 💪`
                    : `Great job! ${totalCal} calories consumed. Keep going! 🌿`}
                </p>
                <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={() => navigate("/chat")}>
                  Chat with me
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="glass-card rounded-2xl p-4"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg md:text-xl font-bold text-foreground">
                  {s.value}
                  <span className="text-xs text-muted-foreground font-normal ml-1">{s.target}</span>
                </p>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${s.bg.replace("/10", "")} opacity-80`}
                    style={{ background: `hsl(var(--${s.color.replace("text-", "")}))` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                {s.label === "Water" && (
                  <div className="flex gap-2 mt-2">
                    <Button size="icon" variant="outline" className="w-7 h-7" onClick={() => updateWater(-1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="outline" className="w-7 h-7" onClick={() => updateWater(1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Mood */}
          <motion.div variants={item} className="glass-card rounded-2xl p-4 md:p-5 mb-5">
            <p className="text-sm font-medium text-foreground mb-3">How are you feeling?</p>
            <div className="flex gap-3 justify-around">
              {["😊", "😐", "😔", "😴", "🤩"].map((e) => (
                <motion.button
                  key={e}
                  onClick={() => setMood(e)}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  className={`text-2xl p-2 rounded-xl transition-colors ${
                    selectedMood === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-secondary"
                  }`}
                >
                  {e}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Today's Meals Checklist */}
          <motion.div variants={item} className="glass-card rounded-2xl p-4 md:p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Today's Meals</h2>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full rounded-full gradient-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${meals.length ? (completedMeals.length / meals.length) * 100 : 0}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {completedMeals.length}/{meals.length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {meals.map((m, i) => (
                  <motion.div
                    key={m.id || i}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                      m.is_complete ? "bg-primary/10 border border-primary/20" : "bg-secondary/50 hover:bg-secondary/80"
                    }`}
                    onClick={() => toggleMealComplete(m.id, m.is_complete)}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                          m.is_complete ? "bg-primary border-primary" : "border-muted-foreground/30"
                        }`}
                        whileTap={{ scale: 0.8 }}
                      >
                        {m.is_complete && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.div>
                      <div>
                        <p className={`text-sm font-medium ${m.is_complete ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {m.meal_type}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px] md:max-w-none">{m.food_items}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-muted-foreground">{m.calories} cal</p>
                      <p className="text-[10px] text-primary">{m.protein}g protein</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Sleep & Streak */}
          <motion.div variants={item} className="grid grid-cols-2 gap-3">
            <motion.div className="glass-card rounded-2xl p-4 text-center" whileHover={{ scale: 1.03 }}>
              <Moon className="w-6 h-6 text-ai mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Sleep</p>
              <p className="text-xl font-bold text-foreground">{dailyLog?.sleep_hours || "—"}h</p>
              <p className="text-[10px] text-muted-foreground">Target: 7-8h</p>
            </motion.div>
            <motion.div className="glass-card rounded-2xl p-4 text-center" whileHover={{ scale: 1.03 }}>
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-xl font-bold text-foreground">{streak > 0 ? `🔥 ${streak} days` : "Start today!"}</p>
              <p className="text-[10px] text-muted-foreground">Log daily to grow</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
