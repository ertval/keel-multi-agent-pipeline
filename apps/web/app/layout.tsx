import type { Metadata } from "next";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keel — Maritime Intelligence Platform",
  description:
    "Laytime and demurrage reconciliation for maritime charterparties. Keel reads owner and charterer statements of facts, applies each charterparty's own weather exception terms, measures excepted periods on the basis the Laytime Definitions supply, and produces an auditable reconciled total. Hackathon demo build: advisory output, not a legal opinion.",
  openGraph: {
    title: "Keel — Maritime Intelligence Platform",
    description:
      "Laytime and demurrage reconciliation for maritime charterparties. A deterministic engine applies each charterparty's own weather-exception terms and publishes the arithmetic behind every figure.",
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
