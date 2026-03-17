import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingDown, Flame, Dumbbell, Droplets, Moon, Footprints, Target, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart, PieChart, Pie, Cell } from "recharts";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PIE_COLORS = ["hsl(122,39%,49%)", "hsl(36,100%,50%)", "hsl(207,90%,54%)", "hsl(0,72%,51%)"];

const ProgressPage = () => {
  const { user, profile } = useAuth();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [mealStats, setMealStats] = useState({ total: 0, completed: 0 });
  const [moodData, setMoodData] = useState<any[]>([]);
  const [sleepAvg, setSleepAvg] = useState(0);
  const [waterAvg, setWaterAvg] = useState(0);

  useEffect(() => { if (user) loadWeeklyData(); }, [user]);

  const loadWeeklyData = async () => {
    if (!user) return;
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    const { data: logs } = await supabase
      .from("daily_logs").select("*").eq("user_id", user.id)
      .gte("date", weekAgo.toISOString().split("T")[0]).order("date");

    const chartData = [];
    const moods: Record<string, number> = {};
    let totalSleep = 0, totalWater = 0, logCount = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const log = logs?.find((l) => l.date === dateStr);
      chartData.push({
        day: dayNames[d.getDay()],
        calories: log?.calories_consumed || 0,
        protein: log?.protein_consumed || 0,
        water: log?.water_intake || 0,
        sleep: log?.sleep_hours || 0,
        steps: log?.steps || 0,
      });
      if (log) {
        logCount++;
        totalSleep += Number(log.sleep_hours) || 0;
        totalWater += log.water_intake || 0;
        if (log.mood) moods[log.mood] = (moods[log.mood] || 0) + 1;
      }
    }
    setWeeklyData(chartData);
    setSleepAvg(logCount ? Math.round((totalSleep / logCount) * 10) / 10 : 0);
    setWaterAvg(logCount ? Math.round(totalWater / logCount) : 0);
    setMoodData(Object.entries(moods).map(([name, value]) => ({ name, value })));

    const { data: meals } = await supabase
      .from("meal_logs").select("is_complete").eq("user_id", user.id)
      .gte("date", weekAgo.toISOString().split("T")[0]);
    if (meals) setMealStats({ total: meals.length, completed: meals.filter((m) => m.is_complete).length });
  };

  const avgCal = weeklyData.length ? Math.round(weeklyData.reduce((s, d) => s + d.calories, 0) / weeklyData.length) : 0;
  const avgProtein = weeklyData.length ? Math.round(weeklyData.reduce((s, d) => s + d.protein, 0) / weeklyData.length) : 0;
  const avgSteps = weeklyData.length ? Math.round(weeklyData.reduce((s, d) => s + d.steps, 0) / weeklyData.length) : 0;
  const completionRate = mealStats.total ? Math.round((mealStats.completed / mealStats.total) * 100) : 0;

  const CAL_TARGET = profile?.goal === "lose" ? 1600 : profile?.goal === "gain" ? 2300 : 1800;

  const summaryCards = [
    { icon: Flame, label: "Avg Calories", value: `${avgCal}`, sub: `/ ${CAL_TARGET}`, color: "text-primary", bg: "bg-primary/10" },
    { icon: Dumbbell, label: "Avg Protein", value: `${avgProtein}g`, sub: "daily", color: "text-accent", bg: "bg-accent/10" },
    { icon: Droplets, label: "Avg Water", value: `${waterAvg}`, sub: "glasses", color: "text-ai", bg: "bg-ai/10" },
    { icon: Moon, label: "Avg Sleep", value: `${sleepAvg}h`, sub: "/ 7-8h", color: "text-primary", bg: "bg-primary/10" },
    { icon: Footprints, label: "Avg Steps", value: avgSteps.toLocaleString(), sub: "/ 8,000", color: "text-accent", bg: "bg-accent/10" },
    { icon: Target, label: "Meal Rate", value: `${completionRate}%`, sub: "completed", color: "text-ai", bg: "bg-ai/10" },
  ];

  const patterns = [];
  const weekdayData = weeklyData.filter((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.getDay() > 0 && d.getDay() < 6; });
  const weekendData = weeklyData.filter((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.getDay() === 0 || d.getDay() === 6; });
  const wdProtein = weekdayData.length ? weekdayData.reduce((s, d) => s + d.protein, 0) / weekdayData.length : 0;
  const weProtein = weekendData.length ? weekendData.reduce((s, d) => s + d.protein, 0) / weekendData.length : 0;
  if (wdProtein < weProtein - 10) patterns.push("You eat less protein on working days.");
  if (avgCal > CAL_TARGET) patterns.push("You're exceeding your calorie target on average.");
  if (sleepAvg < 6) patterns.push("Try getting more sleep — 7-8 hours is ideal.");
  if (waterAvg < 5) patterns.push("Drink more water — aim for 8 glasses daily.");
  if (completionRate > 80) patterns.push("Great meal consistency this week! 🎉");
  if (patterns.length === 0) patterns.push("Keep logging to unlock weekly patterns!");

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-10 max-w-3xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Progress</h1>
            <p className="text-sm text-muted-foreground mb-6">Your weekly health report 📊</p>
          </motion.div>

          {/* Weight Card */}
          <motion.div variants={item} className="glass-card rounded-2xl p-5 mb-5 text-center" whileHover={{ scale: 1.02 }}>
            <p className="text-xs text-muted-foreground">Current Weight</p>
            <motion.p className="text-4xl font-extrabold text-foreground mt-1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              {profile?.weight || "—"} <span className="text-lg">kg</span>
            </motion.p>
            <p className="text-sm text-primary font-medium mt-1">BMI: {profile?.bmi || "—"}</p>
          </motion.div>

          {/* Summary Cards */}
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            {summaryCards.map((s, i) => (
              <motion.div key={s.label} className="glass-card rounded-2xl p-4" whileHover={{ scale: 1.03 }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              >
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value} <span className="text-xs font-normal text-muted-foreground">{s.sub}</span></p>
              </motion.div>
            ))}
          </motion.div>

          {/* Calories Chart */}
          <motion.div variants={item} className="glass-card rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Weekly Calories</h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyData}>
                <defs><linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(122,39%,49%)" stopOpacity={0.4} /><stop offset="95%" stopColor="hsl(122,39%,49%)" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="calories" stroke="hsl(122,39%,49%)" fill="url(#calGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Protein & Water Charts side by side */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Protein (g)</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                  <Bar dataKey="protein" fill="hsl(36,100%,50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Water Intake</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                  <Bar dataKey="water" fill="hsl(207,90%,54%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Sleep Chart */}
          <motion.div variants={item} className="glass-card rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Sleep (hours)</h2>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={weeklyData}>
                <defs><linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(207,90%,54%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(207,90%,54%)" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="sleep" stroke="hsl(207,90%,54%)" fill="url(#sleepGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Mood Distribution */}
          {moodData.length > 0 && (
            <motion.div variants={item} className="glass-card rounded-2xl p-5 mb-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Mood This Week</h2>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                      {moodData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 ml-4">
                  {moodData.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-sm">{m.name} ({m.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Pattern Detection */}
          <motion.div variants={item} className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">🧠 Weekly Patterns</h2>
            <div className="space-y-3">
              {patterns.map((p, i) => (
                <motion.div key={i} className="flex items-start gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                  <Calendar className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{p}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ProgressPage;
