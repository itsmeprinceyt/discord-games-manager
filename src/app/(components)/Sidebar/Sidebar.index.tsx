"use client";
import AdminSidebar from "./Sidebar.Admin";
import UserSidebar from "./Sidebar.User";
import { usePathname } from "next/navigation";

interface SidebarProps {
  role?: "admin" | "user";
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const userRole = role || (pathname.startsWith("/admin") ? "admin" : "user");

  if (userRole === "admin") {
    return <AdminSidebar />;
  }

  return <UserSidebar />;
}
