# VTU App — Mobile (Flutter)

Wallet-based airtime, data, and cable TV reselling app. Talks to the
`web/` Next.js API (`API_BASE_URL`, defaults to the Android emulator's
host loopback `10.0.2.2:3000`).

## Setup

This scaffold was hand-written without the Flutter CLI (it isn't
installed in the environment that generated it), so the native
`android/` and `ios/` project folders are **not** present yet. Once you
have the Flutter SDK installed locally, run this once from `mobile/`:

```bash
flutter create --project-name vtu_app --org com.vtuapp .
flutter pub get
```

This backfills the native platform folders without touching `lib/`,
`pubspec.yaml`, or `analysis_options.yaml`.

## Common commands

```bash
flutter pub get                 # install dependencies
flutter run                     # run on a connected device/emulator
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3000/api
flutter analyze                 # lint
flutter test                    # run tests
flutter build apk --release     # release APK for Phase 1 launch
```
