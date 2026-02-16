#!/usr/bin/env bash
set -euo pipefail

ANDROID_DIR="android"
APP_DIR="$ANDROID_DIR/app/src/main"
JAVA_DIR="$APP_DIR/java/com/yauheni/kwak"
RES_DIR="$APP_DIR/res"

if [ ! -f "$ANDROID_DIR/gradlew" ]; then
  echo "Error: $ANDROID_DIR/gradlew was not found. Run 'npx cap add android' first." >&2
  exit 1
fi

mkdir -p "$JAVA_DIR" "$RES_DIR/layout" "$RES_DIR/values"

cat > "$JAVA_DIR/MainActivity.java" <<'JAVA'
package com.yauheni.kwak;

import android.os.Bundle;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    enableImmersiveMode();
  }

  @Override
  public void onResume() {
    super.onResume();
    enableImmersiveMode();
  }

  private void enableImmersiveMode() {
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

    WindowInsetsControllerCompat insetsController =
        new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());

    insetsController.setSystemBarsBehavior(
        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    insetsController.hide(WindowInsetsCompat.Type.systemBars());
  }
}
JAVA

cat > "$RES_DIR/values/styles.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
    </style>
</resources>
XML

cat > "$RES_DIR/layout/activity_main.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <com.getcapacitor.BridgeWebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</FrameLayout>
XML

cat > "$APP_DIR/AndroidManifest.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true"
            android:label="@string/app_name"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme"
            android:windowSoftInputMode="adjustResize">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
XML

echo "Immersive Android config applied successfully."
