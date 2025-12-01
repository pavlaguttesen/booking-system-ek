import type { Metadata } from "next";
import "./globals.css";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";
import { Inter } from "next/font/google";

import NavBar from "@/components/NavBar";
import NavbarWrapper from "@/components/NavbarWrapper";
import AuthGate from "@/components/AuthGate";
import { AuthProvider } from "@/context/AuthContext"; // Dansk kommentar: Auth provider

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Booking system",
  description: "Book lokaler til undervisning og eksamen",
};

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
    error: [
      "#FFECEC",
      "#FFCECE",
      "#FFABAB",
      "#FF8888",
      "#FF6565",
      "#F94B4B",
      "#E83333",
      "#D21C1C",
      "#B80000",
      "#F11B1B",
    ],
  },
  primaryColor: "primary",
  primaryShade: 9,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} data-theme="light">
      <body className="bg-page text-main font-sans">
        <MantineProvider theme={theme} defaultColorScheme="light">

          {/* Dansk kommentar: Rollen skal hentes før navbar vises */}
          <AuthProvider>
            <AuthGate>

              <NavbarWrapper>
                <NavBar />
              </NavbarWrapper>

              {children}

            </AuthGate>
          </AuthProvider>

        </MantineProvider>
      </body>
    </html>
  );
}
