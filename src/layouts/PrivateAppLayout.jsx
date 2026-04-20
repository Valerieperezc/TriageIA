import MainLayout from "./MainLayout";
import { SoundPreferenceProvider } from "../context/SoundPreferenceContext";
import { PatientProvider } from "../context/PatientContext";

export default function PrivateAppLayout({ children }) {
  return (
    <SoundPreferenceProvider>
      <PatientProvider>
        <MainLayout>{children}</MainLayout>
      </PatientProvider>
    </SoundPreferenceProvider>
  );
}
