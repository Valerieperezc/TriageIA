import { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

const PatientContext = createContext();
export const usePatients = () => useContext(PatientContext);
const PATIENTS_KEY = "triageia-patients";
const HISTORY_KEY = "triageia-history";

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState(() => {
    const savedPatients = localStorage.getItem(PATIENTS_KEY);
    return savedPatients ? JSON.parse(savedPatients) : [];
  });
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const calculateTriage = (temp, fc) => {
    if (temp > 39 || fc > 130) return "I";
    if (temp > 38) return "II";
    return "III";
  };

  const addPatient = ({ name, age, symptom, temp, fc }) => {
    const triage = calculateTriage(temp, fc);

    const p = {
      id: uuid(),
      name,
      age,
      symptom,
      temp,
      fc,
      triage,
      status: "En espera",
      createdAt: Date.now(),
    };

    setPatients(prev => [p, ...prev]);

    setHistory(prev => [
      {
        action: "Paciente creado",
        name,
        triage,
        date: new Date().toLocaleString()
      },
      ...prev
    ]);

    // 🚨 ALERTA SONORA
    if (triage === "I") {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
      audio.play();
    }
  };

  const updateStatus = (id, status) => {
    setPatients(prev =>
      prev.map(p => p.id === id ? { ...p, status } : p)
    );

    const p = patients.find(p => p.id === id);

    setHistory(prev => [
      {
        action: `Estado: ${status}`,
        name: p?.name,
        date: new Date().toLocaleString()
      },
      ...prev
    ]);
  };

  useEffect(() => {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  return (
    <PatientContext.Provider value={{
      patients,
      addPatient,
      updateStatus,
      history
    }}>
      {children}
    </PatientContext.Provider>
  );
}
