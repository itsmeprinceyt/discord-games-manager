"use client";

import dynamic from "next/dynamic";

const DynamicNavbar = dynamic(() => import("./Navbar"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-16 bg-black border-b border-stone-800 flex items-center justify-between px-4">
      <div className="h-8 w-40 bg-stone-800 rounded animate-pulse"></div>
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-stone-800 rounded-full animate-pulse"></div>
      </div>
    </div>
  ),
});

export default function ClientNavbarWrapper() {
  return <DynamicNavbar />;
}
