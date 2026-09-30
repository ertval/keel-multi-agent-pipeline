import type { Metadata } from "next";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keel — Charterer-side demurrage audit",
  description:
    "Charterer-side laytime and demurrage reconciliation. Applies BIMCO 2013 weather-working-day thresholds and produces a cited reconciled total. Output is advisory.",
  openGraph: {
    title: "Keel — Charterer-side demurrage audit",
    description:
      "Charterer-side laytime and demurrage reconciliation. Applies BIMCO 2013 weather-working-day thresholds and produces a cited reconciled total. Output is advisory.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          src="/theme-init.js"
        />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
