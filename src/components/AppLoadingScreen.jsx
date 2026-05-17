import "./AppLoadingScreen.css";

const DEFAULT_MESSAGE = "Preparando el panel clínico…";

function HeartPulseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </svg>
  );
}

export function AppLoadingScreen({ message = DEFAULT_MESSAGE }) {
  return (
    <div
      className="triage-boot"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="app-loading"
    >
      <div className="triage-boot__backdrop" aria-hidden>
        <span className="triage-boot__orb triage-boot__orb--a" />
        <span className="triage-boot__orb triage-boot__orb--b" />
        <span className="triage-boot__orb triage-boot__orb--c" />
        <span className="triage-boot__grid" />
      </div>

      <div className="triage-boot__content">
        <div className="triage-boot__logo-wrap">
          <span className="triage-boot__spinner" />
          <span className="triage-boot__ring" />
          <span className="triage-boot__ring triage-boot__ring--2" />
          <span className="triage-boot__ring triage-boot__ring--3" />
          <span className="triage-boot__logo">
            <HeartPulseIcon />
          </span>
        </div>

        <p className="triage-boot__eyebrow">TriageIA</p>
        <p className="triage-boot__title">Panel clínico</p>

        <div className="triage-boot__ecg" aria-hidden>
          <svg viewBox="0 0 240 48" preserveAspectRatio="none">
            <path
              className="triage-boot__ecg-track"
              d="M0 24 H28 L36 24 L44 8 L52 40 L60 24 H88 L96 24 L104 14 L112 34 L120 24 H148 L156 24 L164 18 L172 30 L180 24 H240"
            />
            <path
              className="triage-boot__ecg-line"
              pathLength="280"
              d="M0 24 H28 L36 24 L44 8 L52 40 L60 24 H88 L96 24 L104 14 L112 34 L120 24 H148 L156 24 L164 18 L172 30 L180 24 H240"
            />
          </svg>
        </div>

        <div className="triage-boot__progress" aria-hidden>
          <span className="triage-boot__progress-bar" />
        </div>

        <p className="triage-boot__message">{message}</p>
      </div>
    </div>
  );
}
