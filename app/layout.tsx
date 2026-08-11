import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noria Technologies — Software for Smart Cities & Businesses",
  description:
    "Noria Technologies builds modular urban mobility and smart city software from Sarajevo for the Western Balkans and Europe.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/noria-logo-header.png",
    shortcut: "/noria-logo-header.png",
    apple: "/noria-logo-header.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
