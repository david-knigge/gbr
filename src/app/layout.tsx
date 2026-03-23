import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Great Benicia Run | STEAM Wheel Quest",
  description:
    "Scan checkpoints, answer STEAM questions, earn raffle entries, and help keep the Wheel turning! Strait to the Finish.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4DBFB3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head />
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
