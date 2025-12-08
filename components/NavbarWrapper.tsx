// Wrapper der håndterer fixed positioning af navigationsbaren og giver indhold margin-top.

"use client";

import { usePathname } from "next/navigation";

export default function NavbarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide navbar on login route
  if (pathname === "/login") return null;

  return <>{children}</>;
}
