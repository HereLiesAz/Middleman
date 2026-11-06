# iosApp

SwiftUI shell around the shared Compose UI. Open `Middleman.xcodeproj` on a Mac and run the `Middleman` scheme.

- The first build phase runs `./gradlew :composeApp:embedAndSignAppleFrameworkForXcode`, which builds the shared `ComposeApp` framework. JDK 21 must be on the path Xcode sees.
- Debug builds talk to `http://localhost:8080` (allowed by `NSAllowsLocalNetworking` in `Info.plist`); release builds to `https://middleman.hereliesaz.com`.
- CI builds the app for the simulator on every change (`.github/workflows/build.yml`, job `ios`), unsigned.
- Not done: signing (pick your team in Xcode), universal links for invite links (needs an Associated Domains entitlement and an `apple-app-site-association` file on the server), and an app icon.
- iOS lets no app handle texts, so the SMS bridge is Android only; the number field never appears here.
