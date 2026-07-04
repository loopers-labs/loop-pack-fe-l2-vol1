import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { installMockApi } from "./productList";

// 임시 mock — `/api/products` 응답을 흉내낸다. week-03 과제 중에는 건드리지 않습니다.
installMockApi();

const root = document.getElementById("root");
if (!root) throw new Error("root 엘리먼트를 찾을 수 없습니다");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
