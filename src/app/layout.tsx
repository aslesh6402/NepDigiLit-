import "./globals.css";
// import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import LanguageProvider from "@/components/LanguageProvider";
// import LanguageSwitcher from '@/components/LanguageSwitcher'
// import OfflineIndicator from '@/components/OfflineIndicator'
import Link from "next/link";
import { Shield } from "lucide-react";
import { Toaster } from "sonner";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Digital Literacy Portal - Bagmati Province",
  description:
    "AI-powered digital literacy and cybersecurity education portal for students in Bagmati Province",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Suspense fallback={<div>Loading...</div>}>
            <main className="flex-1">{children}</main>
            <LanguageProvider>
              <Toaster />
            </LanguageProvider>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
