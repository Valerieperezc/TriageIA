import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Topbar from "../components/Topbar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Sidebar />
      <MobileNav />
      <main className="min-w-0 overflow-x-hidden px-3 py-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4 md:ml-72 md:px-8 md:py-6 md:pb-6">
        <div className="mx-auto w-full min-w-0 max-w-7xl space-y-4 sm:space-y-6">
          <Topbar />
          {children}
        </div>
      </main>
    </div>
  );
}
