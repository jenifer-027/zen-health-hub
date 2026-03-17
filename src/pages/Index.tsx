import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Leaf, Heart, Brain, Utensils, BarChart3, MessageCircle, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.jpg";

const features = [
  { icon: Heart, title: "BMI & Body Analysis", desc: "Indian BMI standards with personalized insights", color: "text-primary" },
  { icon: Utensils, title: "Indian Food Database", desc: "State-wise foods with calories & macros", color: "text-accent" },
  { icon: Brain, title: "AI Health Buddy", desc: "Emotionally supportive chatbot companion", color: "text-ai" },
  { icon: BarChart3, title: "Smart Tracking", desc: "Calories, protein, mood & progress analytics", color: "text-primary" },
  { icon: Shield, title: "Disease-Aware Plans", desc: "Diabetes, PCOS, thyroid-safe diet plans", color: "text-accent" },
  { icon: MessageCircle, title: "Personalized Goals", desc: "Weight loss, gain or maintenance plans", color: "text-ai" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-card">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Fitzen</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Log in
            </Button>
            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => navigate("/login")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero pt-28 pb-16 px-6 md:pt-36 md:pb-24">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-center md:text-left"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              🌿 Your Daily Health Saathi
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-5">
              Smart Indian Health,{" "}
              <span className="text-gradient-primary">Made Simple</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto md:mx-0">
              Personalized diet plans with Indian foods, AI-powered tracking, 
              disease-aware meal suggestions — all in one friendly app.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Button
                size="lg"
                className="gradient-accent text-accent-foreground text-base font-semibold px-8 shadow-lg hover:shadow-xl transition-shadow"
                onClick={() => navigate("/login")}
              >
                Start Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base"
                onClick={() => navigate("/bmi")}
              >
                Check Your BMI
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 max-w-lg"
          >
            <img
              src={heroImage}
              alt="Fitzen - Indian health and wellness"
              className="rounded-2xl shadow-2xl animate-float"
            />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Everything You Need for a Healthier Life
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Built for Indian bodies, foods, and lifestyles — from young to old.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-transform cursor-default"
              >
                <f.icon className={`w-10 h-10 ${f.color} mb-4`} />
                <h3 className="text-lg font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 gradient-hero">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join thousands of Indians taking control of their health with Fitzen.
          </p>
          <Button
            size="lg"
            className="gradient-primary text-primary-foreground text-base font-semibold px-10 shadow-lg"
            onClick={() => navigate("/login")}
          >
            Get Started for Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Fitzen</span>
            <span className="text-xs text-muted-foreground">– Eat Smart. Live Calm.</span>
          </div>
          <p className="text-xs text-muted-foreground">
            ⚕️ This app does not replace medical advice. Always consult your doctor.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
