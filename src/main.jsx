import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { PatientProvider } from "./context/PatientContext";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <PatientProvider>
      <Toaster />
      <App />
    </PatientProvider>
  </AuthProvider>
);