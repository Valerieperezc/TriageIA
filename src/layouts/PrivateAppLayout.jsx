import MainLayout from "./MainLayout";
import { PostLoginPerfRecorder } from "../components/PostLoginPerfRecorder";
import { SoundPreferenceProvider } from "../context/SoundPreferenceContext";
import { PatientProvider } from "../context/PatientContext";
import { useNativeBackButton } from "../hooks/useNativeBackButton";
import { useAuth } from "../hooks/useAuth";
import { getHomePathForRole } from "../utils/roleConfig";

export default function PrivateAppLayout({ children }) {
  const { user } = useAuth();
  useNativeBackButton(getHomePathForRole(user?.role ?? "admin"));

  return (
    <SoundPreferenceProvider>
      <PatientProvider>
        <PostLoginPerfRecorder />
        <MainLayout>{children}</MainLayout>
      </PatientProvider>
    </SoundPreferenceProvider>
  );
}
