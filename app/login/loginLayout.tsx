"use client";

export default function loginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-page">
      {/* Venstre side */}

      <div className="w-1/2 bg-card text-main flex items-center justify-center px-12">
        <>{children}</>
      </div>

      {/* Højre side */}
      <div className="w-1/2 bg-secondary-200 relative overflow-hidden">
        <img
          className="absolute inset-0 scale-150 translate-x-20  object-cover opacity-50 rotate-315"
          src="/ek_sekundaert-logo_business-blue_rgb.png"
          alt="EK sekundært logo"
        />
      </div>
    </div>
  );
}
