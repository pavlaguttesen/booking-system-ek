"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";
import NavbarWrapper from "@/components/NavbarWrapper";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <>
      <div style={{ display: isLoginPage ? "none" : "block" }}>
        <NavbarWrapper>
          <NavBar />
        </NavbarWrapper>
      </div>

      {children}
    </>
  );
}
