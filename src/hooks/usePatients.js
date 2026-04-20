import { useContext } from "react";
import { PatientContext } from "../context/patient-context";

export function usePatients() {
  return useContext(PatientContext);
}
