import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="px-4 py-4 md:ml-72 md:px-8 md:py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <Topbar />
          {children}
        </div>
      </main>
    </div>
  );
}
