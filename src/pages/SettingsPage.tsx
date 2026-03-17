import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Globe, Type, Bell, Shield, LogOut, ChevronRight, Save, ArrowLeft, Loader2, Sun, Moon, Palette, Footprints, BedDouble } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type SettingsView = "main" | "profile" | "health" | "language" | "font" | "theme" | "reminders" | "tracking";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

const SettingsPage = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, signOut, user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<SettingsView>("main");
  const [saving, setSaving] = useState(false);

  // Profile form
  const [name, setName] = useState(profile?.name || "");
  const [age, setAge] = useState(String(profile?.age || ""));
  const [gender, setGender] = useState(profile?.gender || "");
  const [height, setHeight] = useState(String(profile?.height || ""));
  const [weight, setWeight] = useState(String(profile?.weight || ""));
  const [goal, setGoal] = useState(profile?.goal || "maintain");
  const [activityLevel, setActivityLevel] = useState(profile?.activity_level || "moderate");
  const [foodPref, setFoodPref] = useState(profile?.food_preferences || "veg");

  // Health form
  const [diseases, setDiseases] = useState<string[]>(profile?.diseases || []);
  const [medications, setMedications] = useState(profile?.medications?.join(", ") || "");

  // Preferences
  const [language, setLanguage] = useState(profile?.language || "English");
  const [fontSize, setFontSize] = useState(profile?.font_size || "Normal");

  // Theme
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Reminders
  const [waterReminder, setWaterReminder] = useState(true);
  const [mealReminder, setMealReminder] = useState(true);
  const [sleepReminder, setSleepReminder] = useState(false);

  // Tracking
  const [stepTracking, setStepTracking] = useState(false);
  const [sleepTracking, setSleepTracking] = useState(false);
  const [sleepHours, setSleepHours] = useState("7");

  // Apply font size globally
  const applyFontSize = (size: string) => {
    const root = document.documentElement;
    const sizeMap: Record<string, string> = { "Small": "14px", "Normal": "16px", "Large": "18px", "Extra Large": "20px" };
    root.style.fontSize = sizeMap[size] || "16px";
  };

  useEffect(() => {
    // Load theme
    const stored = localStorage.getItem("fitzen-theme") || "light";
    setTheme(stored as "light" | "dark");
    document.documentElement.classList.toggle("dark", stored === "dark");

    // Load & apply font size
    const savedFont = profile?.font_size || localStorage.getItem("fitzen-font-size") || "Normal";
    setFontSize(savedFont);
    applyFontSize(savedFont);

    // Load reminder prefs
    setWaterReminder(localStorage.getItem("fitzen-water-reminder") !== "false");
    setMealReminder(localStorage.getItem("fitzen-meal-reminder") !== "false");
    setSleepReminder(localStorage.getItem("fitzen-sleep-reminder") === "true");
    setStepTracking(localStorage.getItem("fitzen-step-tracking") === "true");
    setSleepTracking(localStorage.getItem("fitzen-sleep-tracking") === "true");
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAge(String(profile.age || ""));
      setGender(profile.gender || "");
      setHeight(String(profile.height || ""));
      setWeight(String(profile.weight || ""));
      setGoal(profile.goal || "maintain");
      setActivityLevel(profile.activity_level || "moderate");
      setFoodPref(profile.food_preferences || "veg");
      setDiseases(profile.diseases || []);
      setMedications(profile.medications?.join(", ") || "");
      setLanguage(profile.language || "English");
      setFontSize(profile.font_size || "Normal");
    }
  }, [profile]);

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("fitzen-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    toast({ title: `${newTheme === "dark" ? "🌙 Dark" : "☀️ Light"} theme activated` });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const h = parseFloat(height) / 100;
      const w = parseFloat(weight);
      const bmi = h && w ? Math.round((w / (h * h)) * 10) / 10 : null;
      await updateProfile({
        name, age: parseInt(age) || null, gender, height: parseFloat(height) || null,
        weight: parseFloat(weight) || null, bmi, goal, activity_level: activityLevel,
        food_preferences: foodPref,
      } as any);
      toast({ title: "Profile updated! ✅" });
      setView("main");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const saveHealth = async () => {
    setSaving(true);
    try {
      await updateProfile({
        diseases,
        medications: medications.split(",").map((s) => s.trim()).filter(Boolean),
      } as any);
      toast({ title: "Health conditions saved! ✅" });
      setView("main");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const savePreferences = async (data: any) => {
    setSaving(true);
    try {
      await updateProfile(data);
      // Apply font size globally if changed
      if (data.font_size) {
        localStorage.setItem("fitzen-font-size", data.font_size);
        applyFontSize(data.font_size);
      }
      // Store language locally too
      if (data.language) {
        localStorage.setItem("fitzen-language", data.language);
      }
      toast({ title: "Preferences saved! ✅" });
      setView("main");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const saveReminders = () => {
    localStorage.setItem("fitzen-water-reminder", String(waterReminder));
    localStorage.setItem("fitzen-meal-reminder", String(mealReminder));
    localStorage.setItem("fitzen-sleep-reminder", String(sleepReminder));

    // Request notification permission
    if ((waterReminder || mealReminder || sleepReminder) && "Notification" in window) {
      Notification.requestPermission();
    }
    toast({ title: "Reminders updated! 🔔" });
    setView("main");
  };

  const saveTracking = async () => {
    localStorage.setItem("fitzen-step-tracking", String(stepTracking));
    localStorage.setItem("fitzen-sleep-tracking", String(sleepTracking));

    // Save sleep hours to daily log
    if (sleepTracking && user) {
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("daily_logs")
        .update({ sleep_hours: parseFloat(sleepHours) || 0 } as any)
        .eq("user_id", user.id)
        .eq("date", today);
    }
    toast({ title: "Tracking settings saved! 📊" });
    setView("main");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const diseaseOptions = ["Diabetes", "PCOS", "Thyroid", "BP", "Heart Disease", "Anemia", "Pregnancy"];

  const BackButton = () => (
    <button onClick={() => setView("main")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );

  const renderView = () => {
    switch (view) {
      case "profile":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <BackButton />
            <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-muted-foreground">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Age</label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Gender</label>
                  <Select value={gender} onValueChange={setGender}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Height (cm)</label><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Weight (kg)</label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Goal</label>
                <Select value={goal} onValueChange={setGoal}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lose">Lose Weight</SelectItem><SelectItem value="gain">Gain Weight</SelectItem><SelectItem value="maintain">Maintain</SelectItem></SelectContent></Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Activity Level</label>
                <Select value={activityLevel} onValueChange={setActivityLevel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sedentary">Sedentary</SelectItem><SelectItem value="light">Light</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="very_active">Very Active</SelectItem></SelectContent></Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Food Preference</label>
                <Select value={foodPref} onValueChange={setFoodPref}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="veg">Vegetarian</SelectItem><SelectItem value="nonveg">Non-Vegetarian</SelectItem><SelectItem value="vegan">Vegan</SelectItem><SelectItem value="jain">Jain</SelectItem></SelectContent></Select>
              </div>
              <Button onClick={saveProfile} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Profile
              </Button>
            </div>
          </motion.div>
        );

      case "health":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <BackButton />
            <h2 className="text-lg font-semibold text-foreground">Health Conditions</h2>
            <p className="text-xs text-muted-foreground">Select any conditions that apply:</p>
            <div className="grid grid-cols-2 gap-2">
              {diseaseOptions.map((d) => (
                <motion.button key={d} whileTap={{ scale: 0.95 }}
                  onClick={() => setDiseases((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${diseases.includes(d) ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                >{d}</motion.button>
              ))}
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Current Medications</label><Input value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="e.g. Metformin, Thyronorm" /></div>
            <Button onClick={saveHealth} disabled={saving} className="w-full gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save
            </Button>
          </motion.div>
        );

      case "language":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <BackButton />
            <h2 className="text-lg font-semibold text-foreground">Language</h2>
            <div className="space-y-2">
              {["English", "Tamil", "Hindi", "Telugu", "Malayalam", "Kannada"].map((l) => (
                <motion.button key={l} whileTap={{ scale: 0.97 }} onClick={() => setLanguage(l)}
                  className={`w-full p-4 rounded-xl text-sm font-medium text-left transition-all ${language === l ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >{l}</motion.button>
              ))}
            </div>
            <Button onClick={() => savePreferences({ language } as any)} disabled={saving} className="w-full gradient-primary text-primary-foreground">Save Language</Button>
          </motion.div>
        );

      case "font":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <BackButton />
            <h2 className="text-lg font-semibold text-foreground">Font Size</h2>
            <div className="space-y-2">
              {["Small", "Normal", "Large", "Extra Large"].map((f) => (
                <motion.button key={f} whileTap={{ scale: 0.97 }} onClick={() => setFontSize(f)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${fontSize === f ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"} ${f === "Small" ? "text-xs" : f === "Normal" ? "text-sm" : f === "Large" ? "text-base" : "text-lg"} font-medium`}
                >{f} — Preview Text</motion.button>
              ))}
            </div>
            <Button onClick={() => savePreferences({ font_size: fontSize } as any)} disabled={saving} className="w-full gradient-primary text-primary-foreground">Save Font Size</Button>
          </motion.div>
        );

      case "theme":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <BackButton />
            <h2 className="text-lg font-semibold text-foreground">Theme</h2>
            <div className="space-y-3">
              {([
                { value: "light" as const, label: "Light Mode", icon: Sun, desc: "Clean bright interface" },
                { value: "dark" as const, label: "Dark Mode", icon: Moon, desc: "Easy on the eyes at night" },
              ]).map((t) => (
                <motion.button key={t.value} whileTap={{ scale: 0.97 }} onClick={() => toggleTheme(t.value)}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${theme === t.value ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                >
                  <t.icon className="w-6 h-6" />
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs opacity-75">{t.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case "reminders":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <BackButton />
            <h2 className="text-lg font-semibold text-foreground">Habit Reminders</h2>
            <p className="text-xs text-muted-foreground">Get gentle nudges to stay on track 🔔</p>
            <div className="space-y-4">
              {[
                { label: "Water Reminders", desc: "Every 2 hours", value: waterReminder, setter: setWaterReminder, emoji: "💧" },
                { label: "Meal Reminders", desc: "Breakfast, lunch, dinner", value: mealReminder, setter: setMealReminder, emoji: "🍽️" },
                { label: "Sleep Reminder", desc: "Bedtime alert at 10 PM", value: sleepReminder, setter: setSleepReminder, emoji: "😴" },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                  <Switch checked={r.value} onCheckedChange={r.setter} />
                </div>
              ))}
            </div>
            <Button onClick={saveReminders} className="w-full gradient-primary text-primary-foreground">Save Reminders</Button>
          </motion.div>
        );

      case "tracking":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <BackButton />
            <h2 className="text-lg font-semibold text-foreground">Activity Tracking</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                <div className="flex items-center gap-3">
                  <Footprints className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Step Counter</p>
                    <p className="text-xs text-muted-foreground">Uses device motion sensor</p>
                  </div>
                </div>
                <Switch checked={stepTracking} onCheckedChange={setStepTracking} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                <div className="flex items-center gap-3">
                  <BedDouble className="w-5 h-5 text-ai" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Sleep Tracking</p>
                    <p className="text-xs text-muted-foreground">Log hours manually</p>
                  </div>
                </div>
                <Switch checked={sleepTracking} onCheckedChange={setSleepTracking} />
              </div>
              {sleepTracking && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <label className="text-xs font-medium text-muted-foreground">Last night's sleep (hours)</label>
                  <Input type="number" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} min="0" max="24" step="0.5" />
                </motion.div>
              )}
            </div>
            <Button onClick={saveTracking} className="w-full gradient-primary text-primary-foreground">Save Tracking</Button>
          </motion.div>
        );

      default:
        return (
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.h1 variants={item} className="text-2xl font-bold text-foreground mb-6">Settings</motion.h1>

            {/* Profile Group */}
            <motion.div variants={item} className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Profile</p>
              <div className="glass-card rounded-2xl overflow-hidden">
                {[
                  { icon: User, label: "Edit Profile", desc: profile?.name || "Name, age, weight, goals", view: "profile" as SettingsView },
                  { icon: Shield, label: "Health Conditions", desc: `${diseases.length} conditions`, view: "health" as SettingsView },
                ].map((itm, i) => (
                  <motion.button key={itm.label} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => setView(itm.view)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <itm.icon className="w-5 h-5 text-primary" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{itm.label}</p>
                      <p className="text-xs text-muted-foreground">{itm.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Preferences Group */}
            <motion.div variants={item} className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preferences</p>
              <div className="glass-card rounded-2xl overflow-hidden">
                {[
                  { icon: Palette, label: "Theme", desc: theme === "dark" ? "Dark Mode" : "Light Mode", view: "theme" as SettingsView },
                  { icon: Globe, label: "Language", desc: language, view: "language" as SettingsView },
                  { icon: Type, label: "Font Size", desc: fontSize, view: "font" as SettingsView },
                  { icon: Bell, label: "Habit Reminders", desc: "Water, meals, sleep", view: "reminders" as SettingsView },
                  { icon: Footprints, label: "Activity Tracking", desc: "Steps & sleep", view: "tracking" as SettingsView },
                ].map((itm, i) => (
                  <motion.button key={itm.label} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => setView(itm.view)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <itm.icon className="w-5 h-5 text-primary" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{itm.label}</p>
                      <p className="text-xs text-muted-foreground">{itm.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Logout */}
            <motion.button variants={item} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 glass-card rounded-2xl text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Log Out</span>
            </motion.button>

            <p className="text-[10px] text-muted-foreground text-center mt-6">
              ⚕️ This app does not replace medical advice.
            </p>
          </motion.div>
        );
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-10 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
