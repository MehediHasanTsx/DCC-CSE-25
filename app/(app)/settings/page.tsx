'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/lib/hooks/useProfile';
import { settingsService } from '@/lib/services/settings.service';
import { backupService } from '@/lib/services/backup.service';
import { profileService } from '@/lib/services/profile.service';
import { CloudSyncStatus } from '@/components/shared/cloud-sync-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  Trash2,
  User,
  GraduationCap,
  AlertTriangle,
  LogOut,
  Shield,
  Camera,
  X,
  Sparkles,
  Bell,
  Volume2,
  Play,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getGravatarUrl } from '@/lib/utils/formatters';
import {
  NOTIFICATION_SOUNDS,
  playNotificationSound,
  stopNotificationSound,
  requestNotificationPermission,
} from '@/lib/utils/sound';
import { syncNotificationSchedules } from '@/lib/utils/schedule-sync';
import {
  isNativeAppSync,
  requestNativeNotificationPermission,
  checkNativeNotificationPermission,
  scheduleTestNotification,
} from '@/lib/utils/capacitor-notifications';
import type { Settings as SettingsType } from '@/types/database';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout, isGuest, exitGuestMode } = useAuth();
  const { profile, reload: reloadProfile } = useProfile();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    // For native apps, we'll check async in useEffect below
    if (isNativeAppSync()) return 'default';
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    settingsService.get().then(setSettings);

    // For native Capacitor apps, check native notification permission
    if (isNativeAppSync()) {
      checkNativeNotificationPermission().then((status) => {
        if (status === 'granted') setPermissionStatus('granted');
        else if (status === 'denied') setPermissionStatus('denied');
        else setPermissionStatus('default');
      });
    }
  }, []);

  const handlePreviewSound = async () => {
    if (isPlayingSound) {
      stopNotificationSound();
      setIsPlayingSound(false);
      return;
    }
    const currentSound = settings?.routineNotificationSound || 'common-hawk-cuckoo';
    setIsPlayingSound(true);
    await playNotificationSound(currentSound);
    setTimeout(() => setIsPlayingSound(false), 3500);
  };

  const handleRequestPermission = async () => {
    if (isNativeAppSync()) {
      const result = await requestNativeNotificationPermission();
      setPermissionStatus(result === 'granted' ? 'granted' : 'denied');
      if (result === 'granted') {
        toast.success('Notification permission granted!');
        void syncNotificationSchedules();
      } else {
        toast.error('Notification permission was not granted.');
      }
      return;
    }
    const res = await requestNotificationPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      toast.success('Notification permission granted!');
      void syncNotificationSchedules();
    } else {
      toast.error('Notification permission was not granted.');
    }
  };

  const handleTestNotification = async () => {
    const currentSound = settings?.routineNotificationSound || 'common-hawk-cuckoo';
    void playNotificationSound(currentSound);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification('DCC CSE Routine Alert (Test)', {
              body: 'Time for Office Work (09:00 – 17:00) • Priority Routine Reminder',
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: 'test-notification',
            });
          } else {
            new Notification('DCC CSE Routine Alert (Test)', {
              body: 'Time for Office Work (09:00 – 17:00) • Priority Routine Reminder',
              icon: '/icon-192.png',
            });
          }
        } else {
          new Notification('DCC CSE Routine Alert (Test)', {
            body: 'Time for Office Work (09:00 – 17:00) • Priority Routine Reminder',
            icon: '/icon-192.png',
          });
        }
      } catch (err) {
        console.warn('Test notification failed:', err);
      }
    }

    toast('🔔 Test Routine Alert Triggered', {
      description: 'Sound played! Priority alerts fire automatically at scheduled routine times.',
      duration: 5000,
    });
  };

  const handleExport = async () => {
    try {
      const { data, filename } = await backupService.exportBackup();
      backupService.downloadFile(data, filename);
      toast.success('Backup exported successfully.');
    } catch {
      toast.error('Failed to export backup.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = backupService.validateBackup(text);

    if (!result.valid || !result.data) {
      toast.error(result.error || 'Invalid backup file.');
      return;
    }

    try {
      await backupService.importBackup(result.data);
      toast.success('Backup restored. Refreshing...');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error('Failed to import backup.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    try {
      await backupService.resetApplication();
    } catch {
      toast.error('Failed to reset.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const updateSetting = async (key: keyof SettingsType, value: unknown) => {
    await settingsService.update({ [key]: value } as Partial<SettingsType>);
    const updated = await settingsService.get();
    setSettings(updated);
    toast.success('Setting updated.');
    // Re-sync notification schedules when notification settings change
    if (key === 'routineNotificationsEnabled' || key === 'routineNotificationSound') {
      void syncNotificationSchedules();
    }
  };

  if (!profile || !settings) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences and data</p>
      </div>

      {/* Account */}
      {user && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <AccountAvatar user={user} profile={profile} onProfileUpdate={reloadProfile} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Username:</span> {user.username}</div>
              <div><span className="text-muted-foreground">Mobile:</span> {user.mobile}</div>
            </div>
            <Separator />
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(true)}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Guest Session Card */}
      {isGuest && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Guest Session
            </CardTitle>
            <CardDescription>
              You are exploring DCC CSE in temporary Guest Mode. Changes are stored in memory and are never saved permanently or synced.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/register" className="flex-1">
                <Button size="sm" className="w-full">Create Free Account</Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button size="sm" variant="outline" className="w-full">Sign In</Button>
              </Link>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                exitGuestMode();
                router.push('/');
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Exit Guest Demo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Appearance */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sun className="h-4 w-4" />Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className="flex-1"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Settings */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" />Academic</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Attendance Target (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={settings.attendanceTarget}
                onChange={(e) => updateSetting('attendanceTarget', parseInt(e.target.value) || 80)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Required Credits</Label>
              <Input
                type="number"
                min={1}
                value={settings.totalRequiredCredits}
                onChange={(e) => updateSetting('totalRequiredCredits', parseInt(e.target.value) || 160)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency Symbol</Label>
              <Input
                value={settings.currencySymbol}
                onChange={(e) => updateSetting('currencySymbol', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routine Priority Notifications & Sound */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> Routine Priority Notifications
            </CardTitle>
            <Switch
              checked={settings.routineNotificationsEnabled ?? true}
              onCheckedChange={(checked) => updateSetting('routineNotificationsEnabled', checked)}
              aria-label="Toggle routine notifications"
            />
          </div>
          <CardDescription>
            Get notified when priority items (e.g. Office, Prayer, Study) start in your daily routine planner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Notification Sound</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handlePreviewSound}
                disabled={!(settings.routineNotificationsEnabled ?? true) || settings.routineNotificationSound === 'none'}
              >
                {isPlayingSound ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current text-rose-500" /> Stop Sound
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 text-emerald-500" /> Preview Sound
                  </>
                )}
              </Button>
            </div>
            <Select
              value={settings.routineNotificationSound || 'common-hawk-cuckoo'}
              onValueChange={(val) => updateSetting('routineNotificationSound', val)}
              disabled={!(settings.routineNotificationsEnabled ?? true)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sound" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_SOUNDS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex flex-col text-left py-0.5">
                      <span className="font-medium text-xs sm:text-sm">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground">{s.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Device & Notification Status */}
          <div className="rounded-lg border border-border/70 p-3 bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">Device Permission</span>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${
                  permissionStatus === 'granted'
                    ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                    : permissionStatus === 'denied'
                    ? 'text-rose-600 dark:text-rose-400 border-rose-500/40'
                    : 'text-amber-600 dark:text-amber-400 border-amber-500/40'
                }`}
              >
                {permissionStatus === 'granted' ? 'Enabled' : permissionStatus === 'denied' ? 'Blocked' : 'Default'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {permissionStatus !== 'granted' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestPermission}
                  className="flex-1 h-8 text-xs min-w-35"
                >
                  <Bell className="mr-1.5 h-3.5 w-3.5" /> Request Permission
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                className="flex-1 h-8 text-xs min-w-35"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Test Sound & Alert
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              💡 <strong>On mobile phones</strong>: Notifications and sounds trigger when the app is installed/downloaded as a PWA on your home screen. Only activities with <strong>&quot;Notify me&quot;</strong> checked in your Routine Planner will ring.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Profile</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {profile.fullName}</div>
            <div><span className="text-muted-foreground">ID:</span> {profile.studentId}</div>
            <div><span className="text-muted-foreground">University:</span> {profile.university}</div>
            <div><span className="text-muted-foreground">Department:</span> {profile.department}</div>
            <div><span className="text-muted-foreground">Batch:</span> {profile.batch}</div>
            <div><span className="text-muted-foreground">Session:</span> {profile.session}</div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" />Data Management</CardTitle>
          <CardDescription>Your data auto-saves to the cloud. Export, import, or reset locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CloudSyncStatus variant="card" />
          <Separator />
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="flex-1">
              <Download className="mr-2 h-4 w-4" /> Export Backup
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
              <Upload className="mr-2 h-4 w-4" /> Import Backup
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
          <Separator />
          <Button variant="destructive" onClick={() => setResetDialogOpen(true)} className="w-full">
            <Trash2 className="mr-2 h-4 w-4" /> Reset Local Data
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            This only removes academic data from this device. Your account and cloud data remain.
          </p>
        </CardContent>
      </Card>

      {/* Logout Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><LogOut className="h-5 w-5" />Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? Your academic data will remain on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Reset Local Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all academic data stored on this device — including profile, attendance records, grades, notes, and settings.
              This action CANNOT be undone. Make sure you have a backup before continuing.
              Your account will NOT be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground">
              Reset Local Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AccountAvatar({ user, profile, onProfileUpdate }: { user: { email?: string | null; username: string }; profile: { fullName: string; email?: string; profilePicture?: string } | null; onProfileUpdate?: () => void }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const email = user.email || profile?.email;
    if (email) {
      getGravatarUrl(email, 120).then(setAvatarUrl);
    }
  }, [user.email, profile?.email]);

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.username.slice(0, 2).toUpperCase();

  // Priority: custom upload > gravatar > default avatar
  const displaySrc = profile?.profilePicture || avatarUrl || '/default-avatar.jpg';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB.');
      return;
    }

    setUploading(true);
    try {
      // Read and resize image to 200x200
      const dataUrl = await resizeImage(file, 200, 200);
      await profileService.setProfilePicture(dataUrl);
      toast.success('Profile picture updated!');
      onProfileUpdate?.();
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      toast.error('Failed to update profile picture.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    try {
      await profileService.removeProfilePicture();
      toast.success('Profile picture removed.');
      onProfileUpdate?.();
    } catch {
      toast.error('Failed to remove profile picture.');
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <Avatar className="h-16 w-16 border-2 border-border">
          <AvatarImage src={displaySrc} alt={profile?.fullName || user.username} />
          <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        {/* Camera overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="h-5 w-5 text-white" />
        </button>
        {/* Remove button */}
        {profile?.profilePicture && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      <div>
        <p className="text-sm font-semibold">{profile?.fullName || user.username}</p>
        <p className="text-xs text-muted-foreground">{user.email || profile?.email || 'No email set'}</p>
        <Button
          variant="link"
          size="sm"
          className="h-5 px-0 text-xs text-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Change Photo'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Resize an image file to the given dimensions and return a base64 data URL.
 */
function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Maintain aspect ratio, crop to square center
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxWidth, maxHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
