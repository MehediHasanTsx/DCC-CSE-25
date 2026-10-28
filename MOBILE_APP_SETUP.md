# 📱 Mobile App Setup (Capacitor Android)

DCC CSE can be packaged as a native Android application using Capacitor.

## Prerequisites

- [Android Studio](https://developer.android.com/studio) (latest stable)
- Java Development Kit (JDK) 17+
- Android SDK (API 24+)
- A deployed Vercel URL for the app

## Setup

### 1. Install Capacitor Dependencies

```bash
bun add @capacitor/core @capacitor/app @capacitor/status-bar @capacitor/local-notifications
bun add -d @capacitor/cli
```

### 2. Configure Server URL

Edit `capacitor.config.ts` and set your Vercel deployment URL:

```ts
server: {
  url: 'https://your-app.vercel.app',
  cleartext: false,
},
```

### 3. Initialize Android Project

```bash
npx cap add android
npx cap sync
```

### 4. Open in Android Studio

```bash
npx cap open android
```

## Building

### Debug APK (for testing)

1. Open the project in Android Studio
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`

### Signed AAB (for Play Store)

1. Go to **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Create or select a keystore
4. Build the release bundle

## Testing

### Direct APK Install
1. Transfer the debug APK to your Android device
2. Enable "Install from unknown sources" if prompted
3. Install and open the app

### Android Emulator
1. In Android Studio, create an AVD (Android Virtual Device)
2. Run the app on the emulator via **Run → Run 'app'**

## Configuration

### App Identity
- **Package ID**: `com.dcccse.app`
- **App Name**: `DCC CSE`

### Updating After Code Changes
After making changes to the web app:
```bash
npx cap sync
npx cap open android
```

## Android-Specific Features

### Native Notifications (Local Notifications)

The app uses `@capacitor/local-notifications` to schedule routine notifications
through Android's **AlarmManager**. This ensures notifications fire reliably even
when:
- The app is in the background
- The app is swiped away from recent apps
- The device is in Doze mode (using `allowWhileIdle`)

**How it works:**
1. When the user creates/updates routines with "Notify me" enabled, the app
   schedules native Android notifications for each activity at the exact time.
2. For weekday-based routines, recurring notifications are set per weekday.
3. For specific-date routines, one-time notifications are scheduled.
4. Schedules are re-synced every 5 minutes and when the app returns to foreground.

**Notification icon setup (Android Studio):**
After running `npx cap add android`, add a notification icon:
1. Right-click `android/app/src/main/res` ? **New ? Image Asset**
2. Select **Icon Type: Notification**
3. Name it `ic_stat_notification`
4. Use a simple monochrome version of your app icon

> **Note:** Notifications only work in the native Android app � desktop/browser
> users do not receive push or scheduled notifications.

### Back Button
The app handles the Android back button to:
- Close open modals/dialogs
- Navigate back in history
- Exit the app when at the root screen

### Status Bar
The status bar is styled to match the app's dark theme (`#090d16`).

## Play Store Publication

1. Create a [Google Play Developer account](https://play.google.com/console)
2. Generate a signed AAB (see above)
3. Create a new app listing in Play Console
4. Upload the AAB
5. Fill in store listing details (screenshots, description, etc.)
6. Submit for review

## Troubleshooting

| Issue | Solution |
|---|---|
| White screen on launch | Check that the server URL in `capacitor.config.ts` is correct and accessible |
| API calls failing | Ensure your Vercel deployment is live and CORS is configured |
| Build errors | Run `npx cap sync` to ensure native projects are up to date |
| Slow loading | The first load requires internet; subsequent loads use cached assets |
| Notifications not firing when app is closed | Ensure `@capacitor/local-notifications` is installed and `npx cap sync` has been run. Check that notification permission is granted in Android Settings. |
| Notification icon missing | Create `ic_stat_notification` in Android Studio (see Native Notifications section above) |
