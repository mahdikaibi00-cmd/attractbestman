import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  title: "The Pattern You Never Saw | Secure Access",
  description: "He didn't lose interest. Something shifted. Discover exactly why he pulled away and what to do next. Unlock the blueprint to stop overthinking and get your control back.",
  openGraph: {
    title: "The Pattern You Never Saw",
    description: "Discover exactly why he pulled away and what to do next.",
    images: ["/ebook1.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Pattern You Never Saw",
    description: "Discover exactly why he pulled away and what to do next.",
    images: ["/ebook1.jpg"],
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
        <Analytics />
      </body>
    </html>
  );
}