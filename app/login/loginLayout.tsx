"use client";

import { MantineProvider } from "@mantine/core";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MantineProvider>
      <div className="w-screen h-screen flex overflow-hidden">
        {/* LEFT SIDE */}
        <div
          className="
            w-1/2 
            flex 
            items-center 
            justify-center 
            bg-white 
            px-[6vw]
          "
        >
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        {/* RIGHT SIDE */}
        <div
          className="
            w-1/2 
            h-full 
            relative 
            bg-[#C9D4F1]
            overflow-hidden
          "
        >
          <img
            src="/ek_sekundaert-logo_business-blue_rgb.png"
            alt="EK sekundært logo"
            className="
              absolute 
              right-[-12%]
              top-[8%]
              w-[90%]
              max-w-none
              opacity-[0.25]
              scale-[1.4]
            "
          />
        </div>
      </div>
    </MantineProvider>
  );
}
