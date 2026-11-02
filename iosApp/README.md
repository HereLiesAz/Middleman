# iosApp

Thin SwiftUI shell around the shared Compose UI. The Xcode project is not committed yet; create it once on a Mac:

1. Xcode → New Project → iOS App, product name `Middleman`, bundle id `com.hereliesaz.middleman`, interface SwiftUI. Save it in this folder.
2. Replace the generated app file with `iosApp/iOSApp.swift`.
3. Build Phases → New Run Script Phase, placed before *Compile Sources*:
   ~~~bash
   cd "$SRCROOT/.."
   ./gradlew :composeApp:embedAndSignAppleFrameworkForXcode
   ~~~
4. Build Settings → *Framework Search Paths*: `$(SRCROOT)/../composeApp/build/xcode-frameworks/$(CONFIGURATION)/$(SDK_NAME)`
   and *Other Linker Flags*: `-framework ComposeApp`. Set *User Script Sandboxing* to `No`.
5. Info.plist: for local development against `http://localhost:8080`, add an App Transport Security exception for `localhost`.
