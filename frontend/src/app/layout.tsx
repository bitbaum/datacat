import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Form Builder | KI-gestützter DataCat-Editor",
  description: "Erstellen Sie schöne, intelligente DataCate für jede Branche – nicht nur HR.",
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
      </body>
    </html>
  );
}
