"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function NavBar() {
  const { role } = useAuth();

  return (
    <header className="w-full bg-secondary-200 px-10 py-4 flex justify-between items-center">

      {/* Logo */}
      <div className="flex items-center gap-4">
        <Image
          src="/logo-ek.png"
          alt="Erhvervsakademiet København"
          width={140}
          height={50}
        />
      </div>

      {/* Navigation */}
      <nav className="flex gap-10 text-primary-600 font-medium text-lg">
        <Link href="/" className="hover:underline">
          Kalender
        </Link>

        <Link href="/min-side" className="hover:underline">
          Min side
        </Link>

        <Link href="/indstillinger" className="hover:underline">
          Indstillinger
        </Link>

        {/* ADMIN LINK — visible only for role === "admin" */}
        {role === "admin" && (
          <Link href="/admin" className="hover:underline">
            Admin
          </Link>
        )}
      </nav>
    </header>
  );
}
