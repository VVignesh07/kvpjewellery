import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force light mode always — remove .dark class if OS adds it
document.documentElement.classList.remove("dark");

createRoot(document.getElementById("root")!).render(<App />);
