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
    default: "DCC CSE 25 | Dhaka City College CSE Batch 25 Student Academic Dashboard",
    template: "%s | DCC CSE 25 - Dhaka City College",
  },
  description:
    "Official Academic Management & Routine Dashboard for Dhaka City College CSE Batch 25 (CSE DCC 25). Track daily class schedules, semester routines, exam seat plans, attendance, CGPA, assignments, and fees with real-time cloud sync.",
  manifest: "/manifest.json",
  keywords: [
    "cse dcc 25",
    "dcc cse 25",
    "cse dcc batch 25",
    "dcc cse batch 25",
    "Dhaka City College CSE 25",
    "Dhaka City College CSE",
    "DCC CSE",
    "DCC CSE routine",
    "DCC CSE syllabus",
    "DCC CSE student dashboard",
    "Dhaka City College Computer Science and Engineering",
    "cse 25 dcc",
    "academic dashboard",
    "routine planner",
    "attendance tracker",
    "CGPA calculator Dhaka City College",
  ],
  authors: [{ name: "Dhaka City College CSE Batch 25" }],
  creator: "CSE DCC 25 Students",
  publisher: "Dhaka City College CSE Department",
  applicationName: "DCC CSE 25",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DCC CSE 25 | Dhaka City College CSE Batch 25 Student Academic Dashboard",
    description:
      "Official Academic Management & Routine Dashboard for Dhaka City College CSE Batch 25 (CSE DCC 25). Track class routines, exam seat plans, attendance, CGPA, and semester fee records.",
    url: APP_URL,
    siteName: "DCC CSE 25 Academic Dashboard",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DCC CSE 25 | Dhaka City College CSE Batch 25 Academic Dashboard",
    description:
      "Track class routines, exam seat plans, attendance, CGPA, and semester fee records for Dhaka City College CSE Batch 25 (CSE DCC 25).",
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
      "name": "DCC CSE 25 - Dhaka City College CSE Batch 25 Academic Dashboard",
      "alternateName": [
        "cse dcc 25",
        "dcc cse 25",
        "CSE DCC 25",
        "Dhaka City College CSE Batch 25",
        "DCC CSE Academic Portal"
      ],
      "url": APP_URL,
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "All",
      "description":
        "Academic companion, routine planner, attendance tracker, and CGPA calculator built specifically for Dhaka City College CSE Batch 25 students.",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BDT"
      }
    },
    {
      "@type": "EducationalOrganization",
      "@id": "https://dhakacitycollege.edu.bd/#organization",
      "name": "Dhaka City College - Computer Science and Engineering (CSE Batch 25)",
      "alternateName": ["Dhaka City College CSE", "DCC CSE", "CSE DCC 25"],
      "url": "https://dhakacitycollege.edu.bd",
      "department": {
        "@type": "Organization",
        "name": "Department of Computer Science and Engineering"
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
