import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AudioPermissionProvider } from "./components/AudioPermissionManager";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI companion",
  description: "Chat with celebrities, ask them questions, and see them do amazing things.",
  openGraph: {
    images: [
      {
        url: "/og_image.png",
        width: 1200,
        height: 630,
        alt: "AI Companion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og_image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AudioPermissionProvider>{children}</AudioPermissionProvider>
        <Analytics />
      </body>
    </html>
  );
}
