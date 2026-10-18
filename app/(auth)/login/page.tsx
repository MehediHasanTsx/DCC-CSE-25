'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Eye, EyeOff, Loader2, WifiOff, HardDriveDownload } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, enterGuestMode, cachedUser, loginOffline, isOffline } = useAuth();
  const [username, setUsername] = useState(cachedUser?.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ username, password });
      if (result.error) {
        setError(result.error);
      } else {
        if (result.isOffline) {
          toast.success('Offline mode: Signed in with locally saved data.');
        } else {
          toast.success('Welcome back!');
        }
        router.replace('/');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineAccess = () => {
    if (!cachedUser) return;
    const ok = loginOffline(cachedUser);
    if (ok) {
      toast.success(`Loaded saved offline dashboard for @${cachedUser.username}`);
      router.replace('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">DCC CSE</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dhaka City College Computer Science & Engineering Student Portal
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Login</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {isOffline && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Offline Mode Active</span>
                </div>
                {cachedUser ? (
                  <div className="space-y-2 pt-1 border-t border-amber-500/20">
                    <p className="text-[11px] leading-relaxed">
                      Saved account <span className="font-bold text-foreground">@{cachedUser.username}</span> is available on this device.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOfflineAccess}
                      className="w-full text-xs font-semibold gap-1.5 h-8 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 shadow-sm cursor-pointer"
                    >
                      <HardDriveDownload className="h-3.5 w-3.5" />
                      Open Saved Offline Dashboard
                    </Button>
                  </div>
                ) : (
                  <p className="text-[11px] leading-relaxed">
                    No account has been signed in on this device yet. First-time sign-in requires an internet connection, or you can explore with Guest Mode below.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isOffline ? 'Opening offline...' : 'Signing in...'}
                  </>
                ) : (
                  isOffline ? 'Login (Offline Mode)' : 'Login'
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or test without account</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                enterGuestMode();
                router.push('/');
              }}
              className="w-full text-xs font-semibold gap-1.5 border-primary/20 text-primary hover:bg-primary/5 cursor-pointer"
            >
              ⚡ Continue as Guest (Demo)
            </Button>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create Account
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 rounded-lg border border-border/80 bg-muted/40 p-3 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">🛡️ Independent Student Project</p>
          <p className="text-[11px] leading-tight">
            Not affiliated with or endorsed by Dhaka City College or NU.
          </p>
          <p className="text-[10px] pt-0.5">
            <Link href="/disclaimer" className="underline hover:text-foreground">
              Read Disclaimer & Terms of Use
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
