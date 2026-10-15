import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { DatabaseProvider } from "@/components/providers/database-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { SwRegister } from "@/components/providers/sw-register";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dcc-cse-25.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "DCC CSE | Dhaka City College Science & Engineering Student Portal",
    template: "%s | DCC CSE",
  },
  description:
    "DCC CSE is the comprehensive student academic dashboard and resource portal for all Dhaka City College Science and Engineering (CSE) students. Track class schedules, National University CGPA, attendance, exam routines, seat plans, and study notes.",
  manifest: "/manifest.json",
  keywords: [
    "DCC CSE",
    "Dhaka City College Science and Engineering",
    "Dhaka City College CSE",
    "DCC CSE notes",
    "DCC CSE resources",
    "DCC CSE 25",
    "DCC CSE student resources",
    "DCC CSE routine",
    "DCC CSE syllabus",
    "NU CGPA calculator",
    "student academic dashboard",
    "attendance tracker",
  ],
  authors: [{ name: "Mehedi Hasan (Batch 25)" }],
  creator: "Mehedi Hasan (DCC CSE Batch 25)",
  publisher: "DCC CSE",
  applicationName: "DCC CSE",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DCC CSE | Dhaka City College Science & Engineering Student Portal",
    description:
      "Academic management companion and resource portal for all Dhaka City College Science and Engineering (CSE) students. Track routines, attendance, CGPA, exam seat plans, and study notes.",
    url: APP_URL,
    siteName: "DCC CSE",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DCC CSE | Dhaka City College Science & Engineering Student Portal",
    description:
      "Academic management companion and resource portal for all Dhaka City College Science and Engineering (CSE) students.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "EYwKFeyOENE8yzlVS7UB_G4r2sfsB1yCvptykocy6MQ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${APP_URL}/#webapp`,
      "name": "DCC CSE | Dhaka City College Science & Engineering Student Portal",
      "alternateName": [
        "DCC CSE",
        "Dhaka City College Science and Engineering",
        "Dhaka City College CSE",
        "DCC CSE 25",
        "DCC CSE notes",
        "DCC CSE resources",
        "DCC CSE student resources"
      ],
      "url": `${APP_URL}/`,
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "All",
      "description":
        "An academic management companion and resource hub for all Dhaka City College Science and Engineering (CSE) students. Features include routine planning, attendance tracking, NU CGPA calculations, exam seat plans, and course notes.",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BDT"
      }
    }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="google-site-verification" content="EYwKFeyOENE8yzlVS7UB_G4r2sfsB1yCvptykocy6MQ" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <DatabaseProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </DatabaseProvider>
          </AuthProvider>
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              duration: 3000,
            }}
          />
          <SwRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
