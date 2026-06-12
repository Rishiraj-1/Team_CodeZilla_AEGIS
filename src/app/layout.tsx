import type { Metadata } from "next";
import { AegisProvider } from "@/context/AegisContext";
import GlobalShell from "@/components/shell/GlobalShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "AEGIS — Autonomous Earth-Orbit Guardian & Intelligence System",
  description:
    "Real-time orbital debris tracking, conjunction assessment, and collision avoidance intelligence. Monitoring 28,441 catalogued objects across all orbital regimes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#080601" />
      </head>
      <body>
        <AegisProvider>
          <GlobalShell>
            {children}
          </GlobalShell>
        </AegisProvider>
      </body>
    </html>
  );
}
