import type { Metadata } from "next";
import "./globals.css";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { MantineProvider } from "@mantine/core";

import { Inter } from "next/font/google";
import NavBar from "@/components/NavBar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Booking system",
  description: "Book lokaler til undervisning og eksamen",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} data-theme="light">
      <body className="bg-page text-main font-sans">
        <MantineProvider defaultColorScheme="light">

          {/* Øverste navigation */}
          <NavBar />

          {/* Sideindhold */}
          <main className="max-w-7xl mx-auto px-6 py-10">
            {children}
          </main>

        </MantineProvider>
      </body>
    </html>
  );
}
