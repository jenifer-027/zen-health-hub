import { Home, Utensils, MessageCircle, BarChart3, Settings, Calculator, Leaf, Calendar, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Calculator, label: "BMI Calculator", path: "/bmi" },
  { icon: Utensils, label: "Meals", path: "/meals" },
  { icon: Calendar, label: "Meal Plan", path: "/meal-plan" },
  { icon: MessageCircle, label: "AI Chat", path: "/chat" },
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-card border-r border-border p-5 z-40">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <motion.div
          className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
        >
          <Leaf className="w-5 h-5 text-primary-foreground" />
        </motion.div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Fitzen</h1>
          <p className="text-[10px] text-muted-foreground">Smart Indian Health</p>
        </div>
      </motion.div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ icon: Icon, label, path }, idx) => {
          const isActive = location.pathname === path;
          return (
            <motion.button
              key={path}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(path)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left",
                isActive
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
            </motion.button>
          );
        })}
      </nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-secondary"
      >
        <p className="text-xs text-muted-foreground">🌿 Fitzen v1.0</p>
        <p className="text-[10px] text-muted-foreground mt-1">Eat Smart. Live Calm.</p>
      </motion.div>
    </aside>
  );
};

export default Sidebar;
