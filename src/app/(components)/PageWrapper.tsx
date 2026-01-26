"use client";
import Sidebar from "./Sidebar/Sidebar.index";

interface PageWrapperProps {
  children: React.ReactNode;
  withSidebar?: boolean;
  sidebarRole?: "admin" | "user";
}

export default function PageWrapper({
  children,
  withSidebar = false,
  sidebarRole,
}: PageWrapperProps) {
  return (
    <div className="min-h-screen w-full relative flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {withSidebar && <Sidebar role={sidebarRole} />}

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>

      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, #000000 40%, #010133 100%)",
        }}
      />
    </div>
  );
}
