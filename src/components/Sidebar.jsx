import { SidebarPanel } from "./SidebarPanel";

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-ink-200/70 bg-white/80 p-5 backdrop-blur-xl md:flex md:flex-col dark:border-ink-800 dark:bg-ink-900/80">
      <SidebarPanel />
    </aside>
  );
}
