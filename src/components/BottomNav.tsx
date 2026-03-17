import { Home, Utensils, MessageCircle, BarChart3, Calendar } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Utensils, label: "Meals", path: "/meals" },
  { icon: Calendar, label: "Plan", path: "/meal-plan" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: BarChart3, label: "Progress", path: "/progress" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 px-2 py-1 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.85 }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <motion.div
                animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              </motion.div>
              <span className="text-[10px] font-medium">{label}</span>
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="bottomNav"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
