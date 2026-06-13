# Android APKs

Built with [Capacitor](https://capacitorjs.com/) wrapping the statically
exported Next.js site.

| File | Build | Signed | Use |
|------|-------|--------|-----|
| `elderly-outing-coach-release.apk` | release | ✅ own key | distribute / install for real use |
| `elderly-outing-coach-debug.apk` | debug | debug key | quick testing only |

- **Application ID:** `com.eoc.outingcoach`
- **minSdk:** 24, **targetSdk:** 36, **versionName:** 1.0

## Install on a phone

1. Copy the `.apk` to an Android device (prefer the **release** one).
2. Allow "Install unknown apps" for your file manager.
3. Tap the file to install.

## Rebuild from source

```bash
npm install
npm run build            # static export -> out/
npx cap sync android
cd android
./gradlew assembleDebug      # -> app/build/outputs/apk/debug/
./gradlew assembleRelease    # signed, needs android/keystore.properties
```

Requires JDK 17+ (JDK 21 used here) and the Android SDK (platform 36).
On machines with TLS-intercepting antivirus, see the note in
`android/gradle.properties`.

## Release signing (not in the repo)

Release builds are signed with a key described by `android/keystore.properties`,
which points to a local keystore. **Both files are gitignored** — signing keys
and passwords must never be committed to a public repo. To reproduce a release
build on another machine, create your own keystore and `keystore.properties`
(see `android/app/build.gradle` for the expected keys). Keep the keystore safe:
losing it means you can no longer publish updates under the same app identity.
