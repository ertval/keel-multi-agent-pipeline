import type { Metadata } from "next";
import Script from "next/script";
import { NavigationScrollReset } from "@/components/NavigationScrollReset";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DM_Sans,
  Source_Serif_4,
  JetBrains_Mono,
  IBM_Plex_Mono,
  Space_Mono,
  Bodoni_Moda,
  Newsreader,
  Fraunces,
  Archivo,
  Bricolage_Grotesque,
  Syne,
} from "next/font/google";
import "./globals.css";

/**
 * Fonts are loaded through `next/font/google`, which self-hosts them and emits
 * real `@font-face` rules.
 *
 * This replaced a remote `@import url('https://fonts.googleapis.com/...')` at
 * the top of `globals.css`, which the Tailwind/Turbopack CSS pipeline strips:
 * the built stylesheet contained zero `@import`, zero `@font-face` and
 * `document.fonts.size === 0` at runtime, so every family silently fell back to
 * a system font. That was invisible in review because the fallbacks render.
 *
 * Each family exposes a CSS variable and `globals.css` keeps the `.font-*`
 * utility classes, so variant components reference families by class name and
 * never by `next/font` import.
 */
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800", "900"], variable: "--font-dm-sans", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600", "700", "800", "900"], variable: "--font-source-serif", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains-mono", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-ibm-plex-mono", display: "swap" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--font-space-mono", display: "swap" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-bodoni-moda", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-fraunces", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-archivo", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const syne = Syne({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-syne", display: "swap" });

const fontVariables = [
  dmSans,
  sourceSerif,
  jetbrainsMono,
  plexMono,
  spaceMono,
  bodoni,
  newsreader,
  fraunces,
  archivo,
  bricolage,
  syne,
];

export const metadata: Metadata = {
  title: "Keel — Maritime Intelligence Platform",
  description:
    "Deterministic laytime calculations, auditable demurrage settlements, and evidentiary reconciliation. Advisory settlement output, not a legal opinion.",
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
    <html
      lang="en"
      suppressHydrationWarning
      className={fontVariables.map((font) => font.variable).join(" ")}
    >
      <head>
        {/* Owns the `dark` class on <html> before first paint. Without it the
            toggle writes `localStorage.theme` but no class, so a reload comes
            back light while the stored preference says dark. `ThemeToggle`
            only reads the DOM, so nothing re-applies it on the client. */}
        <Script id="theme-initializer" strategy="beforeInteractive" src="/theme-init.js" />
      </head>
      <body>
        <TooltipProvider>
          <NavigationScrollReset />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
