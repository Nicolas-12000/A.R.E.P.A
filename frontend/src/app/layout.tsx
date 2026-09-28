import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-fraunces",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "A.R.E.P.A.",
  description:
    "Applied Regression, Estimation & Predictive Analytics. Predice el precio del dólar, la glucosa y el consumo de energía con tres regresiones lineales.",
};

export const viewport: Viewport = {
  themeColor: "#f4f3ec",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
