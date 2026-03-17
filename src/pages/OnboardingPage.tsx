import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, User, Heart, Utensils, Target, Activity, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const steps = ["basics", "body", "health", "goals"] as const;
type Step = typeof steps[number];

const diseaseOptions = ["Diabetes", "PCOS", "Thyroid", "BP", "Heart Disease", "Anemia", "Pregnancy", "None"];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("basics");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [diseases, setDiseases] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [goal, setGoal] = useState("maintain");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [foodPref, setFoodPref] = useState("veg");

  const currentIndex = steps.indexOf(step);
  const isLast = currentIndex === steps.length - 1;

  const next = () => {
    if (!isLast) setStep(steps[currentIndex + 1]);
  };
  const prev = () => {
    if (currentIndex > 0) setStep(steps[currentIndex - 1]);
  };

  const finish = async () => {
    setSaving(true);
    try {
      const h = parseFloat(height) / 100;
      const w = parseFloat(weight);
      const bmi = h && w ? Math.round((w / (h * h)) * 10) / 10 : null;

      await updateProfile({
        name,
        age: parseInt(age) || null,
        gender,
        height: parseFloat(height) || null,
        weight: parseFloat(weight) || null,
        bmi,
        goal,
        activity_level: activityLevel,
        food_preferences: foodPref,
        diseases: diseases.filter((d) => d !== "None"),
        medications: medications.split(",").map((s) => s.trim()).filter(Boolean),
      } as any);
      toast({ title: "Profile setup complete! 🎉" });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "basics":
        return (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-2">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center">Let's get to know you</h2>
            <p className="text-sm text-muted-foreground text-center">This helps us personalize your experience</p>
            <div><label className="text-xs font-medium text-muted-foreground">Your Name</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Age</label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Gender</label>
                <div className="flex gap-2 mt-1">
                  {(["male", "female"] as const).map((g) => (
                    <button key={g} onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        gender === g ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}>
                      {g === "male" ? "👨 Male" : "👩 Female"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "body":
        return (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-2">
              <Activity className="w-6 h-6 text-accent-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center">Body Measurements</h2>
            <p className="text-sm text-muted-foreground text-center">We'll calculate your BMI using Indian standards</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Height (cm)</label><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="165" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Weight (kg)</label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" /></div>
            </div>
            {height && weight && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-4 rounded-xl bg-primary/10">
                <p className="text-xs text-muted-foreground">Your BMI</p>
                <p className="text-3xl font-bold text-primary">
                  {(parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)}
                </p>
              </motion.div>
            )}
          </div>
        );

      case "health":
        return (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <Heart className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center">Health Conditions</h2>
            <p className="text-sm text-muted-foreground text-center">We'll avoid harmful foods & adjust meal timing</p>
            <div className="grid grid-cols-2 gap-2">
              {diseaseOptions.map((d) => (
                <motion.button key={d} whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (d === "None") setDiseases(["None"]);
                    else setDiseases((prev) => prev.filter((x) => x !== "None").includes(d) ? prev.filter((x) => x !== d) : [...prev.filter((x) => x !== "None"), d]);
                  }}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    diseases.includes(d) ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                  {d}
                </motion.button>
              ))}
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Current Medications (optional)</label>
              <Input value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="e.g. Metformin, Thyronorm" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">⚕️ This is only for meal timing. We don't replace medical advice.</p>
          </div>
        );

      case "goals":
        return (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl gradient-ai flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-ai-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center">Your Goals</h2>
            <p className="text-sm text-muted-foreground text-center">We'll build your plan around these</p>
            <div><label className="text-xs font-medium text-muted-foreground">Goal</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[{ v: "lose", l: "Lose Weight", e: "🔥" }, { v: "gain", l: "Gain Weight", e: "💪" }, { v: "maintain", l: "Maintain", e: "⚖️" }].map(({ v, l, e }) => (
                  <button key={v} onClick={() => setGoal(v)}
                    className={`p-3 rounded-xl text-xs font-medium transition-all ${goal === v ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {e}<br />{l}
                  </button>
                ))}
              </div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Activity Level</label>
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">🪑 Sedentary</SelectItem>
                  <SelectItem value="light">🚶 Light</SelectItem>
                  <SelectItem value="moderate">🏃 Moderate</SelectItem>
                  <SelectItem value="active">⚡ Active</SelectItem>
                  <SelectItem value="very_active">🏋️ Very Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Food Preference</label>
              <Select value={foodPref} onValueChange={setFoodPref}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="veg">🥬 Vegetarian</SelectItem>
                  <SelectItem value="nonveg">🍗 Non-Vegetarian</SelectItem>
                  <SelectItem value="vegan">🌱 Vegan</SelectItem>
                  <SelectItem value="jain">☸️ Jain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${i <= currentIndex ? "gradient-primary" : "bg-secondary"}`} />
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-6">
            {currentIndex > 0 && (
              <Button variant="outline" onClick={prev} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            <Button
              onClick={isLast ? finish : next}
              disabled={saving}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {isLast ? "Start My Journey 🌿" : "Next"}
              {!isLast && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
