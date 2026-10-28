import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dcccse.app',
  appName: 'DCC CSE',
  webDir: 'out',
  server: {
    // For development: point to your local dev server
    // url: 'http://localhost:3000',

    // For production: point to your Vercel deployment
    url: 'https://dcc-cse-25.vercel.app/',

    // Set to true only during development with http
    cleartext: false,
  },
  android: {
    backgroundColor: '#090d16',
    allowMixedContent: false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#090d16',
    },
    LocalNotifications: {
      // Use a small icon for the notification tray (Android)
      smallIcon: 'ic_stat_notification',
      // Accent color for the notification icon
      iconColor: '#f59e0b',
      // Default notification sound
      sound: 'notification.wav',
    },
  },
};

export default config;
