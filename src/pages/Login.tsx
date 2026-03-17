import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Mail, Lock, Phone, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signIn } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup && !accepted) {
      toast({
        title: "Please accept the terms",
        description: "You must accept the terms, privacy policy, and medical disclaimer.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await signUp(form.email, form.password, form.name);
        toast({ title: "Account created! 🎉" });
        navigate("/onboarding");
      } else {
        await signIn(form.email, form.password);
        toast({ title: "Welcome back! 🌿" });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <motion.div
            className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3"
            whileHover={{ rotate: 10, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Leaf className="w-7 h-7 text-primary-foreground" />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignup ? "signup" : "login"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h1 className="text-2xl font-bold text-foreground">
                {isSignup ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isSignup ? "Start your health journey today" : "Continue your wellness journey"}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Form */}
        <motion.div
          className="glass-card rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {isSignup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="relative overflow-hidden"
                >
                  <Input
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-10"
                    required
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-10"
                required
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            <AnimatePresence>
              {isSignup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="relative overflow-hidden"
                >
                  <Input
                    type="tel"
                    placeholder="Phone number (optional)"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="pl-10"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pl-10 pr-10"
                required
                minLength={6}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {isSignup && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 pt-2 overflow-hidden"
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={accepted}
                      onCheckedChange={(v) => setAccepted(v === true)}
                    />
                    <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I accept the <span className="text-primary font-medium">Terms & Conditions</span>,{" "}
                      <span className="text-primary font-medium">Privacy Policy</span>, and understand that{" "}
                      <span className="text-destructive font-medium">this app does not replace medical advice</span>.
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-semibold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isSignup ? "Create Account" : "Log In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignup ? "Already have an account? Log in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
