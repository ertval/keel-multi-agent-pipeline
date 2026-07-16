import type { Metadata } from "next";
import Script from "next/script";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keel — Maritime Intelligence Platform",
  description:
    "Enterprise-grade laytime and demurrage reconciliation for maritime charterparties. Keel analyses owner and charterer statements, applies BIMCO 2013 weather clauses, and produces auditable reconciled totals.",
  openGraph: {
    title: "Keel — Maritime Intelligence Platform",
    description: "Enterprise maritime charterparty reconciliation powered by AI.",
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
