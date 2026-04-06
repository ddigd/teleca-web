import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "TELECA — Premium Trading Cards",
    template: "%s | TELECA",
  },
  description: "Premium K-IP trading card collections. Wholesale B2B ordering for card shops, distributors, and retailers worldwide.",
  keywords: ["trading cards", "K-POP", "collectible cards", "wholesale", "B2B", "TELECA", "MIIM CARD", "Korean trading cards", "K-IP"],
  authors: [{ name: "Break & Company" }],
  creator: "Break & Company",
  publisher: "Break & Company",
  metadataBase: new URL("https://teleca-web.vercel.app"),
  openGraph: {
    title: "TELECA — Premium Trading Cards",
    description: "Premium K-IP trading card collections for wholesale buyers worldwide.",
    type: "website",
    siteName: "TELECA",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TELECA Premium Trading Cards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TELECA — Premium Trading Cards",
    description: "Premium K-IP trading card collections for wholesale buyers.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }} suppressHydrationWarning>{children}<Analytics /></body>
    </html>
  );
}
