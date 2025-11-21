import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadAllFonts } from "@/lib/fontLoader";
import { OnboardingProvider } from "@/contexts/OnboardingContext";

// Load fonts as early as possible
loadAllFonts().then(() => {
  console.log('Google Fonts preloaded');
});

createRoot(document.getElementById("root")!).render(
  <OnboardingProvider>
    <App />
  </OnboardingProvider>
);
