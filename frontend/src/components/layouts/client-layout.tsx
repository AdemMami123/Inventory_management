"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layouts/sidebar";
import { NavigationMenuDemo } from "@/components/layouts/nav";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useTheme } from "next-themes";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // Only render UI after component is mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, render a simple layout to prevent hydration errors
  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex flex-col flex-1">
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Hidden on mobile, shown on larger screens */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white shadow-lg transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:block`}
      >
        <Sidebar />
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1">
        {/* Navbar - Includes menu button for mobile */}
        <header className="sticky top-0 z-40 flex items-center h-16 px-4 bg-white shadow-md md:px-6 dark:bg-gray-900">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </Button>
          <div className="flex-1">
            <NavigationMenuDemo />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}