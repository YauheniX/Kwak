# Android APK Build Instructions

## Overview

This document explains how to build and download the Android APK for the Kwak game using GitHub Actions.

## Automatic Build Process

The GitHub Actions workflow automatically builds a debug APK when:
- Code is pushed to the `main` branch
- A tag is pushed to the repository

## Workflow Details

### What the workflow does:

1. **Sets up the environment**: Node.js (latest LTS), JDK 17, and Android SDK
2. **Builds the web app**: Compiles TypeScript and bundles the Phaser game using Vite
3. **Prepares Capacitor**: Installs Capacitor CLI and initializes the project
4. **Adds Android platform**: Creates the native Android project structure
5. **Syncs assets**: Copies the built web app to the Android project
6. **Builds the APK**: Uses Gradle to compile the Android debug APK
7. **Uploads the APK**: Makes the APK available as an artifact or release asset

### APK Output Location

The debug APK is generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Downloading the APK

### Option 1: From GitHub Actions Artifacts (for commits to main)

1. Go to the repository on GitHub
2. Click on the **Actions** tab
3. Select the **Build Android APK** workflow
4. Click on the most recent successful workflow run
5. Scroll down to the **Artifacts** section
6. Click on **kwak-debug-apk** to download the APK
7. The artifact will be downloaded as a ZIP file
8. Extract the ZIP file to get `app-debug.apk`

### Option 2: From Releases (for tagged versions)

1. Go to the repository on GitHub
2. Click on the **Releases** section (right sidebar or `/releases`)
3. Find the release corresponding to your tag
4. Download `app-debug.apk` from the Assets section

## Installing the APK on Android

### Prerequisites
- An Android device with **Developer Options** enabled
- **Install from Unknown Sources** or **Install Unknown Apps** enabled for your file manager

### Installation Steps

1. Transfer the APK to your Android device (via USB, cloud storage, or direct download)
2. Open the APK file using a file manager on your device
3. Tap **Install** when prompted
4. Once installed, tap **Open** to launch the game

### Security Note
The APK is a debug build and is not signed with a production certificate. You may see a warning about installing from unknown sources - this is normal for debug builds.

## Building Locally (Optional)

If you want to build the APK locally instead of using GitHub Actions:

### Prerequisites
- Node.js (v16 or higher)
- npm
- JDK 17
- Android SDK with API level 34+
- Android Studio (recommended) or Android command-line tools

### Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the web app**:
   ```bash
   npm run build
   ```

3. **Install Capacitor**:
   ```bash
   npm install -D @capacitor/cli
   npm install @capacitor/core @capacitor/android @capacitor/status-bar
   ```

4. **Initialize Capacitor** (if not already done):
   ```bash
   npx cap init "Kwak" "com.yauheni.kwak" --web-dir=dist
   ```

5. **Add Android platform** (if not already done):
   ```bash
   npx cap add android
   ```

6. **Sync the web app to Android**:
   ```bash
   npx cap sync android
   ```

7. **Apply immersive Android config patch**:
   ```bash
   ./scripts/capacitor/apply-immersive-config.sh
   ```

8. **Build the APK**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

9. **Find the APK**:
   The APK will be located at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

## Immersive / Edge-to-Edge setup for stable full-screen

Use these exact steps after generating the Android platform (`npx cap add android`) to keep full-screen behavior stable on real devices.

1. **Install and sync StatusBar plugin**:
   ```bash
   npm install @capacitor/status-bar
   npx cap sync android
   ```

2. **Enable overlay in `capacitor.config.ts`**:
   ```ts
   plugins: {
     StatusBar: {
       overlaysWebView: true,
     },
   }
   ```

3. **Set immersive mode in `MainActivity`**:
   - Call `WindowCompat.setDecorFitsSystemWindows(window, false)`.
   - Hide system bars via `WindowInsetsControllerCompat.hide(WindowInsetsCompat.Type.systemBars())`.
   - Re-apply this logic in both `onCreate` and `onResume` to handle cases where OEM ROMs restore bars when app returns to foreground.

4. **Use fullscreen NoActionBar theme in `styles.xml`**:
   - Base theme: `Theme.MaterialComponents.DayNight.NoActionBar`.
   - Keep transparent `statusBarColor` and `navigationBarColor`.
   - Keep `android:windowFullscreen=true`.

5. **Ensure WebView fills the root layout**:
   - In `activity_main.xml`, both root layout and `BridgeWebView` must use `android:layout_width="match_parent"` and `android:layout_height="match_parent"`.

6. **Final sync/build check**:
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew assembleDebug
   ```

7. **Runtime validation on device**:
   - Launch app and verify game content is rendered under status bar/cutout area.
   - Swipe to transiently show bars and check they auto-hide again.
   - Background/foreground app and verify immersive mode is still active.
   - Rotate device once (if orientation unlocked) and re-check insets/content bounds.

## Troubleshooting

### Workflow fails at "Build Android Debug APK" step
- Check that the Android SDK components are properly installed
- Verify that the Gradle build tools version is compatible

### `chmod +x android/gradlew` fails with "No such file or directory"
- The Android platform was not generated correctly (or was partially committed without Gradle wrapper files).
- Regenerate and reapply config:
  ```bash
  rm -rf android
  npx cap add android
  npx cap sync android
  ./scripts/capacitor/apply-immersive-config.sh
  ```

### APK won't install on device
- Ensure "Install from Unknown Sources" is enabled
- Check that your Android version is compatible (minimum API level supported)
- Try uninstalling any previous version of the app

### App crashes on launch
- Check the logcat output using Android Studio or `adb logcat`
- Ensure all web assets were properly synced to the Android project

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
