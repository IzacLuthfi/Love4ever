import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Love4ever",
    template: "%s | Love4ever",
  },

  description:
    "Our memories, our plans, our story — forever.",

  applicationName: "Love4ever",

  keywords: [
    "Love4ever",
    "Memories",
    "Couple",
    "Planner",
    "Gallery",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`
          ${manrope.variable}
          ${playfair.variable}
          antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}