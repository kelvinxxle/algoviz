import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AlgoViz - Topic Library",
  description:
    "Make invisible algorithms visible. A curated library of intermediate-to-advanced algorithms you watch happen, then drive with your own input.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-base text-on-surface">{children}</body>
    </html>
  );
}
