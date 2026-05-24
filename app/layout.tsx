import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--mono-font",
});

const SITE_URL = "https://lamaparbat.com.np";
const TITLE = "Parbat Lama — Senior Full-Stack TypeScript Engineer";
const DESCRIPTION =
  "Senior full-stack TypeScript engineer based in Lalitpur, Nepal. Production React, Node, and agentic systems — building Triage Agent, ADK multi-agent services, and brutalist developer tools.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Parbat Lama",
  },
  description: DESCRIPTION,
  keywords: [
    "Parbat Lama",
    "full-stack engineer",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "agentic AI",
    "Claude Agent SDK",
    "MCP",
    "Nepal",
    "Lalitpur",
    "portfolio",
  ],
  authors: [{ name: "Parbat Lama", url: SITE_URL }],
  creator: "Parbat Lama",
  publisher: "Parbat Lama",
  category: "technology",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Parbat Lama",
    title: TITLE,
    description:
      "Portfolio · React / Next.js / Node / Mongo / Agentic systems. Building Triage Agent + ADK multi-agent services in Lalitpur, Nepal.",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "Senior full-stack TypeScript engineer. Agentic AI, production web platforms, brutalist developer tooling.",
    creator: "@lamadev7",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
  },
  applicationName: "Parbat Lama · Portfolio",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0a0b0a" },
    { media: "(prefers-color-scheme: light)", color: "#0a0b0a" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrains.variable}>
      <body>{children}</body>
    </html>
  );
}
