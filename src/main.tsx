import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-detect system dark mode and apply .dark class
const applyDarkMode = (isDark: boolean) => {
    document.documentElement.classList.toggle("dark", isDark);
};

const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
applyDarkMode(darkMediaQuery.matches);
darkMediaQuery.addEventListener("change", (e) => applyDarkMode(e.matches));

createRoot(document.getElementById("root")!).render(<App />);
