import type { Metadata } from "next";
import "./globals.css";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";
import { Inter } from "next/font/google";

import { AuthProvider } from "@/context/AuthContext";
import LayoutClient from "@/components/LayoutClient";

export const metadata: Metadata = {
  title: "Booking system",
  description: "Book lokaler til undervisning og eksamen",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const theme = createTheme({
  colors: {
    primary: [
      "#E9ECFF",
      "#CBD1FF",
      "#B7C2E6",
      "#AAB6DE",
      "#8798D0",
      "#6075B5",
      "#4A5EA3",
      "#344890",
      "#1F327D",
      "#0038A7",
    ],
  },
  primaryColor: "primary",
  primaryShade: 9,
  fontFamily: "var(--font-sans), Inter, sans-serif",
  headings: { fontFamily: "var(--font-sans), Inter, sans-serif" },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={inter.variable}>
      <body className="bg-page text-main font-sans">
        <MantineProvider theme={theme} defaultColorScheme="light">

          {/* DO NOT USE usePathname HERE — only Client Components */}
          <AuthProvider>
            <LayoutClient>
              {children}
            </LayoutClient>
          </AuthProvider>

          <div id="overlay-root"></div>

        </MantineProvider>
      </body>
    </html>
  );
}
  