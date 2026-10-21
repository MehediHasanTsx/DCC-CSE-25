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
    default: "DCC CSE 25 – Student Academic Dashboard | Dhaka City College",
    template: "%s | DCC CSE 25",
  },
  description:
    "Manage your DCC CSE academic life in one place. Track attendance, calculate GPA and CGPA, view exam routines and results, manage fees, and organize your study plans.",
  manifest: "/manifest.json",
  applicationName: "DCC CSE 25",
  appleWebApp: {
    title: "DCC CSE 25",
    capable: true,
    statusBarStyle: "default",
  },
  keywords: [
    "DCC CSE 25",
    "DCC CSE Student Dashboard",
    "Dhaka City College CSE",
    "DCC CSE class routine",
    "National University CGPA Calculator",
    "NU GPA Calculator",
    "CSE attendance tracker",
    "CSE notes and resources",
    "student routine planner",
    "Dhaka City College Computer Science and Engineering",
    "student academic dashboard",
  ],
  publisher: "DCC CSE 25",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
  },
  openGraph: {
    title: "DCC CSE 25 – Student Academic Dashboard | Dhaka City College",
    description:
      "Manage your DCC CSE academic life in one place. Track attendance, calculate GPA and CGPA, view exam routines and results, manage fees, and organize your study plans.",
    url: APP_URL,
    siteName: "DCC CSE 25",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DCC CSE 25 – Student Academic Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DCC CSE 25 – Student Academic Dashboard | Dhaka City College",
    description:
      "Manage your DCC CSE academic life in one place. Track attendance, calculate GPA and CGPA, view exam routines and results, manage fees, and organize your study plans.",
    images: ["/og-image.png"],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      "url": `${APP_URL}/`,
      "name": "DCC CSE 25",
      "alternateName": [
        "DCC CSE",
        "Dhaka City College CSE 25",
        "DCC CSE 25 Dashboard",
        "DCC CSE 25 Student Dashboard"
      ],
      "description":
        "Manage your DCC CSE academic life in one place. Track attendance, calculate GPA and CGPA, view exam routines and results, manage fees, and organize your study plans.",
      "inLanguage": "en-US"
    },
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      "name": "DCC CSE 25",
      "url": `${APP_URL}/`,
      "logo": {
        "@type": "ImageObject",
        "url": `${APP_URL}/icon-512.png`,
        "width": 512,
        "height": 512
      }
    },
    {
      "@type": "WebApplication",
      "@id": `${APP_URL}/#webapp`,
      "name": "DCC CSE 25 – Student Academic Dashboard | Dhaka City College",
      "alternateName": [
        "DCC CSE 25",
        "DCC CSE",
        "Dhaka City College CSE 25",
        "DCC CSE 25 Dashboard"
      ],
      "url": `${APP_URL}/`,
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "All",
      "description":
        "Manage your DCC CSE academic life in one place. Track attendance, calculate GPA and CGPA, view exam routines and results, manage fees, and organize your study plans.",
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
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-title" content="DCC CSE 25" />
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
            position="bottom-center"
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
