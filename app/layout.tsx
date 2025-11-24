import type { Metadata } from "next";
import "./globals.css";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { MantineProvider } from "@mantine/core";

import Settings from "./overlays/Settings";
import { Inter } from "next/font/google";

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
          <div className="min-h-screen bg-page">
            <nav></nav>
            <Settings />

            <main className="max-w-6xl mx-auto px-6 py-10">
              <div
                className="
                rounded-2xl 
                shadow-md 
                p-6 
                space-y-6 
                bg-card 
                border 
                border-primary-200
              "
              >
                {children}
              </div>
            </main>

            <footer></footer>
          </div>
        </MantineProvider>
      </body>
    </html>
  );
}
