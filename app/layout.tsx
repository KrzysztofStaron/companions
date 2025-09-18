import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AudioPermissionProvider } from "./components/AudioPermissionManager";
import { Analytics } from "@vercel/analytics/next";
import StructuredData from "./components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Companion",
    template: "%s | AI Companion",
  },
  description:
    "Interactive AI companion with realistic animations and voice chat. Chat with AI celebrities, ask them questions, and watch them respond with lifelike expressions and movements.",
  keywords: [
    "AI companion",
    "AI chat",
    "virtual assistant",
    "3D animation",
    "voice chat",
    "artificial intelligence",
    "interactive AI",
    "virtual character",
    "AI conversation",
    "speech synthesis",
  ],
  authors: [{ name: "AI Companion Team" }],
  creator: "AI Companion",
  publisher: "AI Companion",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI Companion - Interactive AI with Realistic Animations",
    description:
      "Experience the future of AI interaction with our intelligent companion featuring lifelike animations, voice chat, and dynamic responses.",
    url: "/",
    siteName: "AI Companion",
    images: [
      {
        url: "/og_image.png",
        width: 1200,
        height: 630,
        alt: "AI Companion - Interactive AI with realistic animations and voice chat",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Companion - Interactive AI with Realistic Animations",
    description:
      "Experience the future of AI interaction with our intelligent companion featuring lifelike animations, voice chat, and dynamic responses.",
    images: ["/og_image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AudioPermissionProvider>{children}</AudioPermissionProvider>
        <Analytics />
      </body>
    </html>
  );
}
