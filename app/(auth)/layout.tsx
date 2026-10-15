import type { Metadata } from 'next';
import { AuthClientLayout } from '@/components/layout/auth-client-layout';

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthClientLayout>{children}</AuthClientLayout>;
}
