import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { App } from "./app";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<div />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StrictMode>,
  );
}
