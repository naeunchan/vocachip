import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@toss/tds-colors/colors.css";

import { BRAND_PRIMARY_COLOR } from "./core/config/brand";
import App from "./core/App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TDSMobileAITProvider brandPrimaryColor={BRAND_PRIMARY_COLOR}>
      <App />
    </TDSMobileAITProvider>
  </StrictMode>,
);
