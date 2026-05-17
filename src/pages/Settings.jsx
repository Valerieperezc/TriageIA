import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Database,
  Download,
  HardDrive,
  KeyRound,
  Mail,
  Moon,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Sun,
  UserRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { usePostLoginPerf } from "../hooks/usePostLoginPerf";
import { useSoundPreference } from "../hooks/useSoundPreference";
import { useTheme } from "../hooks/useTheme";
import {
  accountInitials,
  roleLabel,
  validateAccountProfileForm,
  validateEmailChangeForm,
  validatePasswordChangeForm,
} from "../utils/accountProfile";

function Field({ label, error, children, hint }) {
  return (
    <div className="space-y-1">
      <label className="form-label">{label}</label>
      {children}
      {hint ? (
        <p className="text-[11px] text-ink-500 dark:text-ink-400">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PreferenceRow({ title, description, children }) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink-200/70 py-4 last:border-0 dark:border-ink-700 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const {
    user,
    isSupabaseConfigured,
    updateAccountProfile,
    changeAccountPassword,
    changeAccountEmail,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { soundEnabled, setSoundEnabled } = useSoundPreference();
  const {
    summary: postLoginPerf,
    resetHistory: resetPostLoginHistory,
    downloadPostLoginPerfFile,
  } = usePostLoginPerf({ syncSummaryOnStorageEvents: true });

  const [profileForm, setProfileForm] = useState({
    displayName: "",
    phone: "",
    department: "",
    jobTitle: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const [emailForm, setEmailForm] = useState({ newEmail: "", password: "" });
  const [emailErrors, setEmailErrors] = useState({});
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      displayName: user.displayName ?? "",
      phone: user.phone ?? "",
      department: user.department ?? "",
      jobTitle: user.jobTitle ?? "",
    });
  }, [user]);

  const updateProfileField = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
    setProfileErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const saveProfile = async () => {
    const result = validateAccountProfileForm(profileForm);
    if (!result.valid) {
      setProfileErrors(result.errors);
      return;
    }
    setSavingProfile(true);
    try {
      await updateAccountProfile(result.values);
      toast.success("Perfil actualizado");
    } catch (err) {
      toast.error(err?.message || "No se pudo guardar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPasswordChange = async () => {
    const result = validatePasswordChangeForm(passwordForm);
    if (!result.valid) {
      setPasswordErrors(result.errors);
      return;
    }
    setSavingPassword(true);
    try {
      await changeAccountPassword(
        result.values.currentPassword,
        result.values.newPassword
      );
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      toast.success("Contraseña actualizada");
    } catch (err) {
      toast.error(err?.message || "No se pudo cambiar la contraseña");
    } finally {
      setSavingPassword(false);
    }
  };

  const submitEmailChange = async () => {
    const result = validateEmailChangeForm(emailForm);
    if (!result.valid) {
      setEmailErrors(result.errors);
      return;
    }
    setSavingEmail(true);
    try {
      await changeAccountEmail(result.values.password, result.values.newEmail);
      setEmailForm({ newEmail: "", password: "" });
      setEmailErrors({});
      toast.success("Correo actualizado. Revisa tu bandeja si Supabase pide confirmación.");
    } catch (err) {
      toast.error(err?.message || "No se pudo cambiar el correo");
    } finally {
      setSavingEmail(false);
    }
  };

  const exportPostLoginPerfCsv = useCallback(() => {
    if (!downloadPostLoginPerfFile()) {
      toast.error("No hay datos de telemetría para exportar");
      return;
    }
    toast.success("CSV de telemetría descargado");
  }, [downloadPostLoginPerfFile]);

  const resetPostLoginPerf = useCallback(() => {
    resetPostLoginHistory();
    toast.success("Telemetría post-login reiniciada");
  }, [resetPostLoginHistory]);

  if (!user) {
    return (
      <div className="card p-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Inicia sesión para personalizar tu cuenta.
      </div>
    );
  }

  const displayLabel = user.displayName?.trim() || user.email;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/50 dark:text-brand-200">
          <SettingsIcon className="h-3 w-3" />
          Preferencias
        </span>
        <h1 className="page-title mt-2" data-testid="settings-title">
          Configuración
        </h1>
        <p className="page-subtitle mt-1">
          Personaliza tu cuenta, seguridad e interfaz del panel.
        </p>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="bg-brand-gradient px-5 py-6 text-white">
          <div className="flex items-center gap-4">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur-sm"
              data-testid="settings-avatar"
            >
              {accountInitials(user)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold" data-testid="settings-display-name">
                {displayLabel}
              </p>
              <p className="truncate text-sm text-white/85">{user.email}</p>
              <span className="mt-2 inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                {roleLabel(user.role)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-ink-200/70 bg-ink-50/80 px-4 py-2 text-[11px] text-ink-600 dark:border-ink-700 dark:bg-ink-900/40 dark:text-ink-300">
          {isSupabaseConfigured ? (
            <>
              <Database className="h-3.5 w-3.5 shrink-0" />
              Cuenta en Supabase
            </>
          ) : (
            <>
              <HardDrive className="h-3.5 w-3.5 shrink-0" />
              Modo local (datos en este navegador)
            </>
          )}
        </div>
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-brand-600 dark:text-brand-300" />
          <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
            Mi cuenta
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre para mostrar" error={profileErrors.displayName}>
            <input
              data-testid="settings-display-name-input"
              className="input w-full"
              placeholder="Ej. Dra. Ana Martínez"
              value={profileForm.displayName}
              onChange={(e) => updateProfileField("displayName", e.target.value)}
            />
          </Field>
          <Field label="Teléfono de contacto" error={profileErrors.phone}>
            <input
              data-testid="settings-phone"
              className="input w-full"
              inputMode="tel"
              placeholder="Opcional"
              value={profileForm.phone}
              onChange={(e) => updateProfileField("phone", e.target.value)}
            />
          </Field>
          <Field label="Área / servicio" error={profileErrors.department}>
            <input
              data-testid="settings-department"
              className="input w-full"
              placeholder="Ej. Urgencias"
              value={profileForm.department}
              onChange={(e) => updateProfileField("department", e.target.value)}
            />
          </Field>
          <Field label="Cargo" error={profileErrors.jobTitle}>
            <input
              data-testid="settings-job-title"
              className="input w-full"
              placeholder="Ej. Enfermera de triage"
              value={profileForm.jobTitle}
              onChange={(e) => updateProfileField("jobTitle", e.target.value)}
            />
          </Field>
        </div>
        <Field
          label="Correo de acceso"
          hint={
            isSupabaseConfigured
              ? "Para cambiar el correo usa la sección Seguridad más abajo."
              : "En modo demo el correo de acceso es fijo."
          }
        >
          <input
            className="input w-full bg-ink-50 dark:bg-ink-800/60"
            value={user.email ?? ""}
            readOnly
            data-testid="settings-email-readonly"
          />
        </Field>
        <button
          type="button"
          className="btn btn-primary"
          onClick={saveProfile}
          disabled={savingProfile}
          data-testid="settings-save-profile"
        >
          <Save className="h-4 w-4" />
          {savingProfile ? "Guardando…" : "Guardar perfil"}
        </button>
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-brand-600 dark:text-brand-300" />
          <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
            Seguridad
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contraseña actual" error={passwordErrors.currentPassword}>
            <input
              data-testid="settings-current-password"
              type="password"
              className="input w-full"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) => {
                setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }));
                setPasswordErrors((err) => ({ ...err, currentPassword: undefined }));
              }}
            />
          </Field>
          <div className="hidden sm:block" aria-hidden />
          <Field label="Nueva contraseña" error={passwordErrors.newPassword}>
            <input
              data-testid="settings-new-password"
              type="password"
              className="input w-full"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={(e) => {
                setPasswordForm((p) => ({ ...p, newPassword: e.target.value }));
                setPasswordErrors((err) => ({ ...err, newPassword: undefined }));
              }}
            />
          </Field>
          <Field label="Confirmar nueva contraseña" error={passwordErrors.confirmPassword}>
            <input
              data-testid="settings-confirm-password"
              type="password"
              className="input w-full"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={(e) => {
                setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }));
                setPasswordErrors((err) => ({ ...err, confirmPassword: undefined }));
              }}
            />
          </Field>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={submitPasswordChange}
          disabled={savingPassword}
          data-testid="settings-change-password"
        >
          {savingPassword ? "Actualizando…" : "Cambiar contraseña"}
        </button>

        {isSupabaseConfigured ? (
          <div className="space-y-4 border-t border-ink-200/70 pt-4 dark:border-ink-700">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-ink-500" />
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                Cambiar correo
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nuevo correo" error={emailErrors.newEmail}>
                <input
                  data-testid="settings-new-email"
                  type="email"
                  className="input w-full"
                  autoComplete="email"
                  value={emailForm.newEmail}
                  onChange={(e) => {
                    setEmailForm((p) => ({ ...p, newEmail: e.target.value }));
                    setEmailErrors((err) => ({ ...err, newEmail: undefined }));
                  }}
                />
              </Field>
              <Field
                label="Contraseña actual"
                error={emailErrors.password}
                hint="Necesaria para confirmar el cambio"
              >
                <input
                  data-testid="settings-email-password"
                  type="password"
                  className="input w-full"
                  autoComplete="current-password"
                  value={emailForm.password}
                  onChange={(e) => {
                    setEmailForm((p) => ({ ...p, password: e.target.value }));
                    setEmailErrors((err) => ({ ...err, password: undefined }));
                  }}
                />
              </Field>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={submitEmailChange}
              disabled={savingEmail}
              data-testid="settings-change-email"
            >
              {savingEmail ? "Actualizando…" : "Cambiar correo"}
            </button>
          </div>
        ) : null}
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
          Interfaz y alertas
        </h2>
        <div className="mt-2">
          <PreferenceRow
            title="Tema"
            description="Modo claro u oscuro en todo el panel."
          >
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-secondary"
              data-testid="settings-theme-toggle"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  Modo claro
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Modo oscuro
                </>
              )}
            </button>
          </PreferenceRow>
          <PreferenceRow
            title="Alertas sonoras"
            description="Sonido cuando aumentan pacientes críticos CTAS I en cola."
          >
            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                toast.success(
                  soundEnabled ? "Alertas silenciadas" : "Sonidos activados"
                );
              }}
              className="btn btn-secondary"
              data-testid="settings-sound-toggle"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  Activadas
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  Silenciadas
                </>
              )}
            </button>
          </PreferenceRow>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950/40 dark:text-brand-200 dark:ring-brand-900/50">
            <Activity className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
              Telemetría UX (post-login)
            </h2>
            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
              Historial local del tiempo de transición tras iniciar sesión.
            </p>
            {postLoginPerf.samples > 0 ? (
              <p
                className="mt-2 text-xs text-ink-600 dark:text-ink-300"
                data-testid="settings-post-login-summary"
              >
                Última transición: <strong>{postLoginPerf.lastMs} ms</strong> ·
                Promedio: <strong>{postLoginPerf.avgMs} ms</strong> (
                {postLoginPerf.samples} muestra(s))
              </p>
            ) : (
              <p
                className="mt-2 text-xs text-ink-500 dark:text-ink-400"
                data-testid="settings-post-login-empty"
              >
                Sin muestras aún. Inicia sesión y entra al panel para registrar
                la primera medición.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary text-xs"
            onClick={exportPostLoginPerfCsv}
            data-testid="settings-post-login-export"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary text-xs"
            onClick={resetPostLoginPerf}
            data-testid="settings-post-login-reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar historial
          </button>
        </div>
      </section>
    </div>
  );
}
