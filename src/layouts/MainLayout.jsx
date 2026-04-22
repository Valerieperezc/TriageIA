import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import MobileNav from "../components/MobileNav";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-4 pb-28 sm:p-6">
        <Topbar />
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
