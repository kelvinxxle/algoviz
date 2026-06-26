import type { Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { rootMetadata } from "@/lib/metadata";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const materialSymbols = localFont({
  src: "./fonts/material-symbols-outlined.woff2",
  variable: "--font-symbols",
  display: "block",
  weight: "400",
});

export const metadata = rootMetadata();

export const viewport: Viewport = {
  themeColor: "#131313",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${jetbrainsMono.variable} ${materialSymbols.variable}`}
    >
      <body className="bg-base text-on-surface">{children}</body>
    </html>
  );
}
