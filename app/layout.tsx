import type { Metadata } from "next";
import "./globals.css";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SettingsProvider } from "@/context/SettingsContext";
import "../translate/index";

import { AuthProvider } from "@/context/AuthContext";

import NavbarWrapper from "@/components/NavbarWrapper";
import NavBar from "@/components/NavBar";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da" className={inter.variable}>
      <body className="bg-page text-main font-sans">
        <ThemeProvider>
          <LanguageProvider>
            <MantineProvider theme={theme} defaultColorScheme="light">
              <AuthProvider>
                <SettingsProvider>
                  <NavbarWrapper>
                    <NavBar />
                  </NavbarWrapper>

                  {children}
                </SettingsProvider>
              </AuthProvider>
            </MantineProvider>
          </LanguageProvider>
        </ThemeProvider>

        {/* 🔥🔥 MÅ IKKE LIGGE INDE I MantineProvider */}
        <div id="overlay-root"></div>
      </body>
    </html>
  );
}
