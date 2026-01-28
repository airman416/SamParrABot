import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SamGPT | AI-Powered Quote Search",
  description: "Search through every Sam Parr quote from the My First Million podcast using AI-powered semantic search.",
  keywords: ["Sam Parr", "My First Million", "podcast", "quotes", "AI search"],
  authors: [{ name: "Sam Parr" }],
  openGraph: {
    title: "SamGPT",
    description: "AI-Powered Quote Search from My First Million Podcast",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SamGPT",
    description: "AI-Powered Quote Search from My First Million Podcast",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
