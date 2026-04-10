import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function MainLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <Topbar />
        {children}
      </main>
    </div>
  );
}