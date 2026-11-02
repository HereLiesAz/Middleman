# Middleman — Compose Multiplatform rewrite

## Decisions
- Kotlin Multiplatform monorepo, package root `com.hereliesaz.middleman`.
- Targets: Android (Play build), iOS (arm64 + simulator arm64), desktop (JVM), web (Wasm).
- Ktor server in-repo; SQLite behind a `SessionStore` interface.
- Two real devices minimum, N participants (cap 8). Pairing via 6-character invite code.
- Mediators: heuristic (offline floor), Gemini, Claude (official Java SDK) behind `LlmMediator`, wrapped in `FallbackMediator`.
- Canned scenarios kept as read-only "How it works" walkthroughs.
- TypeScript PWA, screenshots, and `.aistudio/` removed.

## Steps
- [x] Gradle scaffold: version catalog, wrapper 9.8.2, Maven Central mirror first (Central rate-limits shared egress)
- [x] `shared`: models, clean-fight rules, readiness (N-party generalization; two people score exactly as before), API client
- [x] `server`: routes, sanitization, hashed tokens, consented bridges, held messages, timeouts, WebSocket push
- [x] Mediators: heuristic, Gemini, Claude, fallback
- [x] Compose UI: threshold, private room, joint room, readiness line, insight panel, bridge consent, breathing timeout, walkthroughs
- [x] Android app: AAB, R8, env-based signing, cleartext only in debug, backup exclusion, adaptive monochrome icon
- [x] Delete TS/PWA and debris; rewrite README
- [x] CI workflow (Linux: tests + all JVM/Android/web builds; macOS: iOS framework)
- [ ] iOS Xcode project (needs a Mac; steps in `iosApp/README.md`)
- [ ] Production server URL for release builds (`-Pmiddleman.server=`; placeholder default)

## Review
Verified locally:
- `:shared:jvmTest`: 12 tests, all passing. `:server:test`: 9 tests, all passing, including an end-to-end run of the shipped client and its WebSocket stream.
- `:androidApp:assembleDebug` and `:androidApp:bundleRelease` (R8) build. Release AAB is 4.1 MB, unsigned.
- `:composeApp:compileProductionExecutableKotlinWasmJs` compiles.
- Desktop app run against a live server under Xvfb; welcome screen and private room checked by screenshot.

Not verified here:
- The webpack bundle (`wasmJsBrowserDistribution`) fetches a package from GitHub, which this sandbox blocks. CI runs it.
- iOS: Kotlin/Native iOS targets can't build on Linux. CI runs them on macOS.
- Android runtime, including R8 with kotlinx.serialization: there's no emulator here.

Bugs caught by verification:
- The client rejected the `101 Switching Protocols` WebSocket handshake, so live updates would never have connected.
- No root content color was set, so most text rendered near-black on black.
- The heuristic picked a theme from its first matching keyword ("house" → chores); now the theme with the most matches wins.
