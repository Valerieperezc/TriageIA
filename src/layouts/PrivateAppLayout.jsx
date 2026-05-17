import MainLayout from "./MainLayout";
import { PostLoginPerfRecorder } from "../components/PostLoginPerfRecorder";
import { SoundPreferenceProvider } from "../context/SoundPreferenceContext";
import { PatientProvider } from "../context/PatientContext";

export default function PrivateAppLayout({ children }) {
  return (
    <SoundPreferenceProvider>
      <PatientProvider>
        <PostLoginPerfRecorder />
        <MainLayout>{children}</MainLayout>
      </PatientProvider>
    </SoundPreferenceProvider>
  );
}
