import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dcc-cse-25.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/disclaimer',
        '/icon-192.png',
        '/icon-512.png',
        '/favicon.ico',
        '/og-image.png',
        '/manifest.json',
      ],
      disallow: [
        '/api/',
        '/admin/',
        '/attendance/',
        '/planner/',
        '/exams/',
        '/fees/',
        '/gpa/',
        '/results/',
        '/routine/',
        '/subjects/',
        '/assignments/',
        '/notes/',
        '/analytics/',
        '/lab-projects/',
        '/settings/',
        '/onboarding/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
