import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("root 엘리먼트를 찾을 수 없습니다");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
