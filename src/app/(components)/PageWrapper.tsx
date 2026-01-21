"use client";
export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full relative">
      {children}
      <div
        className="absolute inset-0 -z-1"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, #000000 40%, #010133 100%)",
        }}
      />
    </div>
  );
}
