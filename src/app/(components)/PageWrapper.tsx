"use client";
export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-linear-to-r from-rose-400 to bg-rose-500 ">
      {children}
    </div>
  );
}
