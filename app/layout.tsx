import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { ExampleBanner } from "@/components/example-banner";
import { GoogleSignInGate } from "@/components/google-sign-in";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Tramo — Pipeline de contactos",
  description: "Tablero kanban para seguir clínicas por fase y ver cuántos correos se enviaron por formato.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${sourceSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="flex min-h-full min-w-0 flex-col">
          <AppHeader />
          <GoogleSignInGate>
            <ExampleBanner />
            <main className="min-w-0 flex-1">{children}</main>
          </GoogleSignInGate>
        </div>
      </body>
    </html>
  );
}
