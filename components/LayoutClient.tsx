// Klient-side layout wrapper som viser navigationsbaren på alle sider undtagen login-siden.

"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";
import NavbarWrapper from "@/components/NavbarWrapper";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <>
      {!isLoginPage && (
        <NavbarWrapper>
          <NavBar />
        </NavbarWrapper>
      )}

      {children}

      <div id="overlay-root"></div>
    </>
  );
}
