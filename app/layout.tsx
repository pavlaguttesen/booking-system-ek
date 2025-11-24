import type { Metadata } from "next";
import "./globals.css";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import { MantineProvider } from "@mantine/core";

import Settings from "./overlays/Settings";
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
    <html lang="en">
      <body
        style={{
          backgroundColor: "#0D1117", // page baggrund
          color: "#C9D1D9",
        }}
      >
        <MantineProvider defaultColorScheme="dark">
          {/* Hele siden i en mørk wrapper */}
          <div className="min-h-screen" style={{ backgroundColor: "#0D1117" }}>
            {/* Midter-panel */}
            <nav></nav>
            <Settings></Settings>
            <main className="max-w-6xl mx-auto px-6 py-10">
              <div
                className="rounded-2xl shadow-xl p-6 space-y-6"
                style={{
                  backgroundColor: "#161B22",
                  border: "1px solid #30363D",
                }}
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
