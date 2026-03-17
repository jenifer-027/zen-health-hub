import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, ArrowRight, TrendingDown, TrendingUp, Ruler, Scale, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

type BMICategory = "underweight" | "normal" | "overweight" | "obese" | null;

const categoryInfo: Record<string, { label: string; color: string; emoji: string; tip: string }> = {
  underweight: { label: "Underweight", color: "text-ai", emoji: "💙", tip: "Let's build a healthy weight gain plan with nutritious Indian foods!" },
  normal: { label: "Normal", color: "text-primary", emoji: "💚", tip: "Great job! Let's maintain this with a balanced Indian diet." },
  overweight: { label: "Overweight", color: "text-accent", emoji: "🧡", tip: "A mindful eating plan with Indian staples can help you feel your best." },
  obese: { label: "Obese", color: "text-destructive", emoji: "❤️", tip: "Small changes matter. We'll create a safe, sustainable plan for you." },
};

// Indian BMI classification thresholds
const getCategory = (bmi: number): BMICategory => {
  if (bmi < 18.5) return "underweight";
  if (bmi < 23) return "normal";
  if (bmi < 25) return "overweight";
  return "obese";
};

// Calculate healthy weight range for given height (Indian BMI 18.5-23)
const getHealthyWeightRange = (heightCm: number) => {
  const hm = heightCm / 100;
  return { min: Math.round(18.5 * hm * hm * 10) / 10, max: Math.round(23 * hm * hm * 10) / 10 };
};

// Ponderal Index = weight / height^3 (kg/m³)
const getPonderalIndex = (weightKg: number, heightCm: number) => {
  const hm = heightCm / 100;
  return Math.round((weightKg / (hm * hm * hm)) * 10) / 10;
};

// Approximate weight-for-age percentile (simplified, adult 18-65)
const getWeightPercentile = (weightKg: number, gender: string, age: number) => {
  // Simplified median/SD based on Indian population data
  const median = gender === "male" ? 65 + (age > 40 ? 3 : 0) : 55 + (age > 40 ? 4 : 0);
  const sd = gender === "male" ? 12 : 10;
  const z = (weightKg - median) / sd;
  // Normal CDF approximation
  const p = 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI)));
  return Math.round(p * 100);
};

// Approximate height-for-age percentile (Indian adult)
const getHeightPercentile = (heightCm: number, gender: string) => {
  const median = gender === "male" ? 167 : 153;
  const sd = gender === "male" ? 7 : 6;
  const z = (heightCm - median) / sd;
  const p = 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI)));
  return Math.round(p * 100);
};

const BMICalculator = () => {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<BMICategory>(null);
  const [details, setDetails] = useState<{
    healthyRange: { min: number; max: number };
    ponderal: number;
    weightPercentile: number;
    heightPercentile: number;
    weightToLoseOrGain: number | null;
    bmiRange: { min: number; max: number };
  } | null>(null);

  const calculateBMI = () => {
    const hCm = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age) || 25;
    if (!hCm || !w) return;

    const hm = hCm / 100;
    const result = Math.round((w / (hm * hm)) * 10) / 10;
    const cat = getCategory(result);
    const healthyRange = getHealthyWeightRange(hCm);

    let weightToChange: number | null = null;
    if (result > 23) weightToChange = Math.round((w - healthyRange.max) * 10) / 10;
    else if (result < 18.5) weightToChange = Math.round((healthyRange.min - w) * 10) / 10;

    setBmi(result);
    setCategory(cat);
    setDetails({
      healthyRange,
      ponderal: getPonderalIndex(w, hCm),
      weightPercentile: getWeightPercentile(w, gender, a),
      heightPercentile: getHeightPercentile(hCm, gender),
      weightToLoseOrGain: weightToChange,
      bmiRange: { min: 18.5, max: 23 },
    });

    // Save to profile
    updateProfile({ height: hCm, weight: w, age: a, gender, bmi: result }).catch(() => {});
  };

  const bmiPercentage = bmi ? Math.min((bmi / 40) * 100, 100) : 0;

  return (
    <AppLayout>
      <div className="p-4 md:p-8 lg:p-10 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">BMI & Body Analysis</h1>
              <p className="text-sm text-muted-foreground">Indian BMI Standards (Asian Cutoffs)</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Gender</label>
              <div className="flex gap-3">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      gender === g
                        ? "gradient-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {g === "male" ? "👨 Male" : "👩 Female"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Age</label>
                <Input placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} type="number" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Height (cm)</label>
                <Input placeholder="165" value={height} onChange={(e) => setHeight(e.target.value)} type="number" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Weight (kg)</label>
                <Input placeholder="65" value={weight} onChange={(e) => setWeight(e.target.value)} type="number" />
              </div>
            </div>

            <Button onClick={calculateBMI} className="w-full gradient-accent text-accent-foreground font-semibold">
              <Activity className="w-4 h-4 mr-2" /> Calculate BMI & Analyze
            </Button>
          </div>

          {/* Results */}
          {bmi !== null && category && details && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 mt-5"
            >
              {/* BMI Score */}
              <div className="glass-card rounded-2xl p-5">
                <div className="text-center mb-4">
                  <span className="text-5xl font-extrabold text-foreground">{bmi}</span>
                  <p className={`text-lg font-semibold mt-1 ${categoryInfo[category].color}`}>
                    {categoryInfo[category].emoji} {categoryInfo[category].label}
                  </p>
                </div>

                <div className="w-full h-3 rounded-full bg-secondary overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${bmiPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full gradient-primary"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
                  <span>Underweight (&lt;18.5)</span>
                  <span>Normal (18.5-23)</span>
                  <span>Overweight (23-25)</span>
                  <span>Obese (&gt;25)</span>
                </div>
                <p className="text-sm text-muted-foreground text-center">{categoryInfo[category].tip}</p>
              </div>

              {/* Detailed Analysis */}
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" /> Detailed Body Analysis
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/60 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground">Weight-for-age percentile</p>
                    <p className="text-lg font-bold text-foreground">{details.weightPercentile}%</p>
                  </div>
                  <div className="bg-secondary/60 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground">Height-for-age percentile</p>
                    <p className="text-lg font-bold text-foreground">{details.heightPercentile}%</p>
                  </div>
                </div>

                <div className="bg-secondary/60 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground">Healthy BMI range (Indian)</p>
                  <p className="text-sm font-bold text-foreground">{details.bmiRange.min} – {details.bmiRange.max} kg/m²</p>
                </div>

                <div className="bg-secondary/60 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-primary" />
                    <p className="text-[10px] text-muted-foreground">Healthy weight for your height</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{details.healthyRange.min} kg – {details.healthyRange.max} kg</p>
                </div>

                {details.weightToLoseOrGain !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-2"
                  >
                    {bmi! > 23 ? (
                      <TrendingDown className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                    <p className="text-sm text-foreground">
                      {bmi! > 23
                        ? `Lose ${details.weightToLoseOrGain} kg to reach a BMI of ${details.bmiRange.max} kg/m²`
                        : `Gain ${details.weightToLoseOrGain} kg to reach a BMI of ${details.bmiRange.min} kg/m²`}
                    </p>
                  </motion.div>
                )}

                <div className="bg-secondary/60 rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground">Ponderal Index</p>
                  <p className="text-sm font-bold text-foreground">{details.ponderal} kg/m³</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {details.ponderal < 11 ? "Thin build" : details.ponderal > 15 ? "Stocky build" : "Average build"}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full gradient-primary text-primary-foreground font-semibold"
              >
                Get My Personalized Plan <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default BMICalculator;
