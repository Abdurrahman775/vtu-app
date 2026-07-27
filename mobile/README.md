# VTU App — Mobile (Flutter)

Wallet-based airtime, data, and cable TV reselling app. Talks to the
`web/` Next.js API.

## Setup

The **web** platform is scaffolded (`flutter create --platforms=web`),
so `flutter run -d chrome` works out of the box — no Android SDK or
emulator needed for day-to-day development. Android/iOS aren't scaffolded
yet; add them when a real device build is actually needed:

```bash
flutter create --platforms=android,ios .
```

This only backfills the native platform folders — it never touches
`lib/`, `pubspec.yaml`, or `analysis_options.yaml`, so it's safe to run
against the existing project.

## Common commands

```bash
flutter pub get                 # install dependencies
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000/api
flutter analyze                 # lint
flutter test                    # run tests
flutter build apk --release     # release APK (once Android is scaffolded)
```

`API_BASE_URL` defaults to `http://10.0.2.2:3000/api`, the Android
emulator's alias for the host machine — **always override it for Chrome**
(`http://localhost:3000/api`) or a real device (`http://<your-lan-ip>:3000/api`).
The backend sends permissive CORS headers on `/api/**` (see
`web/src/proxy.ts`) specifically so a browser-hosted build can reach it
across origins.
