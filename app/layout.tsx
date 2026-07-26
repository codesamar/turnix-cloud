import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: BRAND.name,
    template: `%s · ${BRAND.name}`,
  },
  description: "Unified cloud drive aggregation platform",
  applicationName: BRAND.name,
  icons: {
    icon: [
      { url: BRAND.icon32, sizes: "32x32", type: "image/png" },
      { url: BRAND.icon192, sizes: "192x192", type: "image/png" },
      { url: BRAND.icon512, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: BRAND.name,
    description: "Unified cloud drive aggregation platform",
    siteName: BRAND.name,
    images: [{ url: BRAND.icon512, width: 512, height: 512, alt: BRAND.name }],
  },
  twitter: {
    card: "summary",
    title: BRAND.name,
    description: "Unified cloud drive aggregation platform",
    images: [BRAND.icon512],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
