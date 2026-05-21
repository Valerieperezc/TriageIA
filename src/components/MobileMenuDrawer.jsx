import { useEffect } from "react";
import { SidebarPanel } from "./SidebarPanel";

export function MobileMenuDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        role="presentation"
        aria-hidden={!open}
        className={`fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        data-testid="mobile-menu-backdrop"
      />
      <aside
        id="mobile-menu-drawer"
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-[60] flex w-[min(18rem,88vw)] flex-col border-r border-ink-200/70 bg-white/95 p-5 shadow-soft-lg backdrop-blur-xl transition-transform duration-200 ease-out md:hidden dark:border-ink-800 dark:bg-ink-900/95 ${
          open ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        data-testid="mobile-menu-drawer"
      >
        <SidebarPanel onNavigate={onClose} onClose={onClose} />
      </aside>
    </>
  );
}
