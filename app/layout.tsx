import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { ServiceWorker } from "@/components/ServiceWorker";
import { Splash } from "@/components/Splash";

export const metadata: Metadata = {
  title: "Grounded",
  description: "Find calm. Simplify decisions. Stay grounded.",
  applicationName: "Grounded",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Grounded",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh text-stone-900 antialiased transition-colors duration-300 dark:text-stone-100">
        <Splash />
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-3xl px-5 pb-32 pt-6">
            {children}
          </main>
          <ServiceWorker />
        </Providers>
      </body>
    </html>
  );
}
