# CertMaster AI iOS setup

The iOS application is an additional Capacitor platform. It does not replace the Electron renderer, desktop SQLite database, or desktop release workflow.

## Requirements

- macOS with full Xcode 16 or newer installed from the App Store
- Xcode Command Line Tools selected under **Xcode → Settings → Locations**
- Node.js 22+
- pnpm 10+
- An Apple ID for a physical device
- An Apple Developer Program membership for TestFlight or App Store distribution

The deployment target is iOS/iPadOS 15.0. The bundle identifier is `com.farukcevik.certmasterai` and can be changed in Xcode if the identifier is already registered by another team.

## Install, test, and synchronize

```bash
cd "/Users/farukcevik/Documents/ChatGPT/certmaster-ai"
pnpm install --frozen-lockfile
pnpm run test:mobile
pnpm run build:mobile
pnpm exec cap sync ios
```

Every mobile web change must be followed by `pnpm run ios:sync` before running the native application.

## Open in Xcode

```bash
cd "/Users/farukcevik/Documents/ChatGPT/certmaster-ai"
pnpm run ios:open
```

Alternatively open `ios/App/App.xcodeproj`. Capacitor 8 uses Swift Package Manager; do not create a CocoaPods workspace.

## Run in Simulator

1. Open the project in Xcode.
2. Select the **App** scheme.
3. Select an iPhone or iPad Simulator.
4. Choose **Product → Run**.
5. Verify the home screen reports 349 questions while the Mac is offline.
6. Start practice mode, select answers, close the app, relaunch it, and use **Sınava Devam Et**.

Command-line unsigned Simulator build:

```bash
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath ios/App/DerivedData \
  CODE_SIGNING_ALLOWED=NO \
  build
```

## Install on a physical iPhone or iPad

1. Connect the device to the Mac and trust the computer.
2. Open `ios/App/App.xcodeproj` in Xcode.
3. Select **App → Signing & Capabilities**.
4. Enable **Automatically manage signing** and select your Apple development team.
5. If necessary, change the bundle identifier to a unique identifier owned by your team.
6. Select the connected device as the run destination.
7. Choose **Product → Run**.
8. For a free Apple ID profile, trust the developer profile under the device's **Settings → General → VPN & Device Management**. Free profiles normally expire after seven days.

The application requests no camera, microphone, location, contacts, advertising, or tracking permission. Backup import uses the system Files picker; export uses the iOS Share Sheet.

## Offline data and SQLite

- Native persistence uses `@capacitor-community/sqlite`, not `better-sqlite3`.
- The database is created under `Library/CapacitorDatabase` on first launch.
- The authorized 349-question JSON bank and its embedded images are compiled into the mobile web bundle and inserted with stable identifiers.
- `INSERT OR IGNORE` and a schema migration table prevent duplicate initialization.
- Sessions store question order, stable option order, answers, review flags, current position, and remaining time.
- Statistics reset deletes sessions and attempts in a transaction while preserving questions, settings, and bookmarks.

The SQLite plugin links SQLCipher even when application-level encryption is disabled. Review Apple's encryption export requirements before App Store submission; do not make an export-compliance declaration without legal review.

## Signing and distribution

Development installation uses an Apple Development certificate. TestFlight/App Store distribution requires an Apple Developer Program account, a registered App ID, distribution signing, archive validation, privacy answers, screenshots, and App Store review.

No API keys or signing credentials belong in the repository. Use the Xcode keychain locally and GitHub encrypted secrets for any future automated archive workflow.

## Troubleshooting

- **`xcodebuild requires Xcode`**: install full Xcode and run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
- **Swift package resolution failure**: in Xcode use **File → Packages → Reset Package Caches**, then resolve packages again.
- **Blank or old UI**: run `pnpm run ios:sync`, clean the Xcode build folder, and run again.
- **SQLite opens but no questions appear**: delete the app from the Simulator/device, rebuild, and inspect Xcode logs for the first migration error.
- **Signing error**: choose a valid team and a bundle identifier unique to that team.
- **App Store encryption question**: review the SQLCipher export note above before selecting an answer.
