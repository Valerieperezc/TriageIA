import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemePreferenceProvider } from "./context/ThemePreferenceContext";
import { AppToaster } from "./components/AppToaster";
import { AppShell } from "./components/AppShell";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemePreferenceProvider>
    <AuthProvider>
      <AppToaster />
      <AppShell />
    </AuthProvider>
  </ThemePreferenceProvider>
);