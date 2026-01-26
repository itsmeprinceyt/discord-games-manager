"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bookmark,
} from "lucide-react";
import { usePathname } from "next/navigation";

const userNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Manage Accounts",
    href: "/dashboard/accounts",
    icon: <Bookmark className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    title: "Help & Support",
    href: "/dashboard/help",
    icon: <HelpCircle className="h-5 w-5" />,
  },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-4 left-4 z-50 p-2 bg-black border border-stone-800 rounded text-white cursor-pointer"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`
        ${isCollapsed ? "w-16" : "w-64"} min-h-screen bg-black border-r border-stone-800 p-2
        transition-all duration-300
        fixed lg:relative z-40
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute top-1/2 -right-3 bg-black border border-stone-800 rounded-full p-1 text-stone-400 hover:text-white hover:border-stone-700 transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Navigation */}
        <nav className="space-y-1">
          {userNavItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard/"
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${
                  isCollapsed ? "justify-center px-2" : "space-x-3 px-4"
                } py-3 rounded-md transition-colors group ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-800/50"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/30"
                }`}
              >
                {item.icon}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-black border border-stone-800 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {item.title}
                  </div>
                )}

                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.title}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
