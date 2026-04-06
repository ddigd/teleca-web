import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TELECA — Premium Trading Cards",
  description: "Premium K-IP trading card collections. Wholesale B2B ordering for card shops, distributors, and retailers worldwide.",
  keywords: "trading cards, K-POP, collectible cards, wholesale, B2B, TELECA, MIIM CARD",
  openGraph: {
    title: "TELECA — Premium Trading Cards",
    description: "Premium K-IP trading card collections for wholesale buyers.",
    type: "website",
    siteName: "TELECA",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
