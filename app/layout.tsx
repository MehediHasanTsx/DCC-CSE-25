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
    default: "DCC CSE 25 | Dhaka City College Science & Engineering",
    template: "%s | DCC CSE 25",
  },
  description:
    "DCC CSE 25 is an academic management companion and resource portal for Dhaka City College Science and Engineering (CSE Batch 25) students. Track class routines, NU CGPA, attendance, exam schedules, seat plans, and study resources.",
  manifest: "/manifest.json",
  keywords: [
    "DCC CSE 25",
    "DCC CSE",
    "Dhaka City College Science and Engineering",
    "Dhaka City College CSE",
    "DCC CSE notes",
    "DCC CSE resources",
    "DCC CSE 25 student resources",
    "Dhaka City College CSE Batch 25",
    "DCC CSE routine",
    "DCC CSE syllabus",
    "NU CGPA calculator",
    "student academic dashboard",
    "attendance tracker",
  ],
  authors: [{ name: "DCC CSE Batch 25 Students" }],
  creator: "DCC CSE 25",
  publisher: "DCC CSE 25",
  applicationName: "DCC CSE 25",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DCC CSE 25 | Dhaka City College Science & Engineering",
    description:
      "Academic management companion and resource portal for Dhaka City College Science and Engineering (CSE Batch 25) students. Track routines, attendance, CGPA, exam seat plans, and study notes.",
    url: APP_URL,
    siteName: "DCC CSE 25",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DCC CSE 25 | Dhaka City College Science & Engineering",
    description:
      "Academic management companion and resource portal for Dhaka City College Science and Engineering (CSE Batch 25) students.",
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
      "name": "DCC CSE 25 | Dhaka City College Science & Engineering",
      "alternateName": [
        "DCC CSE 25",
        "DCC CSE",
        "Dhaka City College Science and Engineering",
        "Dhaka City College CSE",
        "DCC CSE notes",
        "DCC CSE resources",
        "DCC CSE 25 student resources"
      ],
      "url": `${APP_URL}/`,
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "All",
      "description":
        "An academic management companion and resource hub for Dhaka City College Science and Engineering (CSE Batch 25) students. Features include routine planning, attendance tracking, NU CGPA calculations, exam seat plans, and course notes.",
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
