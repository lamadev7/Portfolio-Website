import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--mono-font",
});

export const metadata: Metadata = {
  title: "Parbat Lama — Senior Full-Stack TypeScript Engineer",
  description:
    "Portfolio of Parbat Lama. Senior full-stack TypeScript engineer based in Lalitpur, Nepal — production React, Node, and agentic systems.",
  metadataBase: new URL("https://lamaparbat.com.np"),
  openGraph: {
    title: "Parbat Lama — Senior Full-Stack TypeScript Engineer",
    description:
      "Portfolio · React / Next.js / Node / Mongo / Agentic systems. Based in Lalitpur, Nepal.",
    type: "website",
  },
  robots: { index: true, follow: true },
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
