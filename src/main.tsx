import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme on load
const savedTheme = localStorage.getItem("fitzen-theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}

// Apply saved font size on load
const savedFontSize = localStorage.getItem("fitzen-font-size");
if (savedFontSize) {
  const sizeMap: Record<string, string> = { "Small": "14px", "Normal": "16px", "Large": "18px", "Extra Large": "20px" };
  document.documentElement.style.fontSize = sizeMap[savedFontSize] || "16px";
}

createRoot(document.getElementById("root")!).render(<App />);
