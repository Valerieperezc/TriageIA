import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import { MobileMenuDrawer } from "../components/MobileMenuDrawer";
import { AppBuildMarker } from "../components/AppBuildMarker";
import { AppToolbar } from "../components/AppToolbar";
import { MobileStickyHeader } from "../components/MobileStickyHeader";
import { RetryHealthNotifier } from "../components/RetryHealthNotifier";

export default function MainLayout({ children }) {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <RetryHealthNotifier />
      <Sidebar />
      <MobileMenuDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <MobileNav />
      <AppBuildMarker />
      <main className="min-w-0 overflow-x-hidden px-3 py-2 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-3 md:ml-72 md:px-8 md:py-6 md:pb-6">
        <div className="mx-auto w-full min-w-0 max-w-7xl space-y-4 sm:space-y-6">
          <MobileStickyHeader
            mobileMenuOpen={mobileMenuOpen}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
          <div className="hidden md:block">
            <AppToolbar
              mobileMenuOpen={mobileMenuOpen}
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
            />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
