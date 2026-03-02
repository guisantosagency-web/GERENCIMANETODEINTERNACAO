import type React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SecurityShield } from "@/components/security-shield"
import { VisualEditsMessenger } from "orchids-visual-edits";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import "./globals.css"

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "HTO Caxias - Protocolo de Internação",
  description: "Sistema de Gestão de Internações do Hospital de Trauma e Ortopedia de Caxias",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${outfit.variable}`}>
      <body className="antialiased font-outfit bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground min-h-screen">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="765d993f-cbc8-4432-89af-8e1fb3f8c868"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
        />
        <SecurityShield />
        <main className="relative z-0">
          {children}
        </main>
        <Analytics />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}