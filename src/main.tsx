import "@fontsource-variable/manrope";
import "@fontsource/playfair-display/700.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./tailwind.css";
import "../styles.css";
import "./react-app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
