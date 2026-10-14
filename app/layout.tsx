import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Muckly | Your App Mockups Made Easy",
  description: "Muckly is a premium SaaS that turns your raw mobile app emulator screenshots into clean, professional, and customizable device mockups instantly. Your app mockups made easy.",
  metadataBase: new URL("https://usemuckly.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Muckly",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Muckly | Your App Mockups Made Easy",
    description: "Instantly generate beautiful, production-ready device mockups from mobile screenshots. Your app mockups made easy.",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Muckly Premium Brand Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muckly | Your App Mockups Made Easy",
    description: "Instantly generate beautiful, production-ready device mockups from mobile screenshots. Your app mockups made easy.",
    images: ["/logo.png"],
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { PWARegistry } from "@/components/pwa-registry";
import { MobileNav } from "@/components/mobile-nav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <PWARegistry />
          <MobileNav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
