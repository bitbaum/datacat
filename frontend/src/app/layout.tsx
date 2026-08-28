import type { Metadata } from "next";
import Script from "next/script";
// Bundled fonts from the `geist` package — next/font/google fetched these at
// build time, which fails on the self-host build machine without Google access.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import GlobalNavigation from './components/GlobalNavigation';
import Providers from './providers';
import { UsageMonitor } from './components/UsageMonitor';

const geistSans = GeistSans;
const geistMono = GeistMono;

/**
 * Where this site actually serves. Load-bearing for the social preview: Next
 * resolves the generated og:image against `metadataBase`, and without it the
 * tag is emitted as http://localhost:3000/opengraph-image — present, plausible,
 * and unfetchable by every scraper. Falls back to the real host, not localhost.
 */
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://datacat.orangecat.ch";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Form Builder | KI-gestützter DataCat-Editor",
  description: "Erstellen Sie schöne, intelligente DataCate für jede Branche – nicht nur HR.",
  openGraph: {
    title: "DataCat — KI-gestützter Formular-Editor",
    description: "Erstellen Sie schöne, intelligente Formulare für jede Branche – nicht nur HR.",
    url: SITE_URL,
    siteName: "DataCat",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full bg-white">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <Providers>
          <GlobalNavigation />
          {children}
          <UsageMonitor />
          <footer className="bg-gray-800 text-white py-6 mt-auto dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="mb-4 sm:mb-0">&copy; {new Date().getFullYear()} DataCat. All rights reserved.</p>
            <nav className="flex space-x-4">
              <a href="/privacy" className="hover:text-gray-300" aria-label="Datenschutz">Privacy</a>
              <a href="/terms" className="hover:text-gray-300" aria-label="Nutzungsbedingungen">Terms</a>
              <a href="/contact" className="hover:text-gray-300" aria-label="Kontakt">Contact</a>
            </nav>
          </div>
          </footer>
        </Providers>

        {/* FleetCrown feedback widget — env-gated, see docs/architecture/feedback-widget.md */}
        {process.env.NEXT_PUBLIC_FC_WIDGET_TOKEN && (
          <Script
            src="https://fleetcrown.orangecat.ch/widget.js"
            strategy="afterInteractive"
            data-fc-project={process.env.NEXT_PUBLIC_FC_WIDGET_TOKEN}
          />
        )}
      </body>
    </html>
  );
}
