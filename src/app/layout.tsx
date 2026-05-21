import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Avvai — Pure Food. Naturally Yours.",
    template: "%s | Avvai Natural Foods",
  },
  description:
    "Shop 100% organic, chemical-free groceries, cold-pressed oils, millets, spices, and traditional foods. Farm-to-home freshness delivered to your doorstep.",
  keywords: [
    "organic food",
    "natural foods",
    "cold pressed oils",
    "millets",
    "chemical free",
    "farm fresh",
    "organic groceries",
    "herbal products",
    "traditional foods",
  ],
  authors: [{ name: "Avvai Natural Foods" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Avvai Natural Foods",
    title: "Avvai — Pure Food. Naturally Yours.",
    description:
      "Shop 100% organic, chemical-free groceries, cold-pressed oils, millets, spices, and traditional foods.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Avvai — Pure Food. Naturally Yours.",
    description:
      "Shop 100% organic, chemical-free groceries, cold-pressed oils, millets, spices, and traditional foods.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-cream-100 font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
