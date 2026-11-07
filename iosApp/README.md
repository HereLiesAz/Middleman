# iosApp

SwiftUI shell around the shared Compose UI. Open `Middleman.xcodeproj` on a Mac and run the `Middleman` scheme.

- The first build phase runs `./gradlew :composeApp:embedAndSignAppleFrameworkForXcode`, which builds the shared `ComposeApp` framework. JDK 21 must be on the path Xcode sees.
- Debug builds talk to `http://localhost:8080` (allowed by `NSAllowsLocalNetworking` in `Info.plist`); release builds to `https://middleman.hereliesaz.com`.
- CI builds the app for the simulator on every change (`.github/workflows/build.yml`, job `ios`), unsigned.
- Invite links open the app (Associated Domains entitlement in the project; the server serves `apple-app-site-association` once `APPLE_APP_IDS=TEAMID.com.hereliesaz.middleman` is set). The app icon is the same two points and a line as Android.
- Not done: signing. Pick your team in Xcode (Signing & Capabilities); without it only the unsigned simulator build works.
- iOS lets no app handle texts, so the SMS bridge is Android only; the number field never appears here.
