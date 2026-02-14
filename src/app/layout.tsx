import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://configen.dev'),
  title: {
    default: 'Configen — Visual Server Config Generator',
    template: '%s | Configen',
  },
  description: 'Free, open-source visual config generator for Nginx, Caddy, and Docker Compose. Generate, import, lint, and edit production-ready configs in your browser.',
  openGraph: {
    title: 'Configen — Visual Server Config Generator',
    description: 'Generate, import, lint, and edit production-ready server configurations visually. 100% client-side.',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Configen',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Configen Preview' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Configen — Visual Server Config Generator',
    description: 'Free, open-source, runs in your browser. Generate & lint Nginx configs.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Configen",
              url: "https://configen.dev",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0" },
              description:
                "Free, open-source visual config generator & linter for Nginx. Generate, import, lint, and edit production-ready configs in your browser.",
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrains.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
