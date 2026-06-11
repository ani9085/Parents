# Android APK

`elderly-outing-coach-debug.apk` — debug build of the Elderly Outing Coach app,
packaged with [Capacitor](https://capacitorjs.com/) wrapping the statically
exported Next.js site.

- **Application ID:** `com.eoc.outingcoach`
- **Build type:** debug (unsigned / debuggable — for testing, not Play Store)
- **minSdk:** 24, **targetSdk:** 36

## Install on a phone

1. Copy the `.apk` to an Android device.
2. Allow "Install unknown apps" for your file manager.
3. Tap the file to install.

## Rebuild from source

```bash
npm install
npm run build          # static export -> out/
npx cap sync android
cd android
./gradlew assembleDebug   # APK at app/build/outputs/apk/debug/
```

Requires JDK 17+ (JDK 21 used here) and the Android SDK (platform 36).
On machines with TLS-intercepting antivirus, see the note in
`android/gradle.properties`.
