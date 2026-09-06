import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noria Technologies — Software for Smart Cities & Businesses",
  description:
    "Noria Technologies builds modular urban mobility and smart city software from Sarajevo for the Western Balkans and Europe.",
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
    <html lang="bs">
      <body className="antialiased">{children}</body>
    </html>
  );
}
