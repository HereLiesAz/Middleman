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

---

# v2: Middleman is the timeout (relay model)

## Model
- Starting a session is a softer kind of block: "talk to me through Middleman until you can be respectful."
- Each participant has **one room: theirs, with Middleman**. No joint room, no readiness gate, no timeouts.
- **Relay:** whatever someone wants the others to hear, Middleman delivers, but in its own words.
  It paraphrases, strips cruelty and threats, keeps the substance, and delivers it into each other room as
  "From Alex, through Middleman: …". The sender sees exactly what was delivered.
  - Detection: the mediator decides each turn whether the message includes something for the others (`relay: string | null`).
  - Pure abuse with no substance gets nothing delivered; the sender is told why.
- **Groups kept:** a starter plus any number of others. Relays go to everyone else.
- **Link:** the starter gets `https://middleman.hereliesaz.com/j/<code>` to share. On Android it opens the app (App Links); anywhere else, the web app.

## Lifetime
- **Resolution is Middleman's call**, not the starter's (the starter may be the one in the wrong).
  After each turn the mediator returns `resolved: { reason } | null`. Resolution requires a recent turn from everyone.
- **Optional expiry**, set by the starter at creation: none / 1 / 3 / 7 / 30 days.
- **On resolution or expiry the session is deleted**, along with its messages and tokens. Clients get a final closing note
  over the stream, then the session ceases to exist on the server.
- **Supersede:** a stable anonymous device identity (random id, stored on the device) links people across sessions.
  When someone joins a new session, any older live session containing both them and this session's starter is deleted,
  group sessions included. Confirmed.

## Removed
- Joint room, readiness score and meter, clean-fight *holding* (the rules now feed the paraphrase/censor), timeouts and breathing.
- Consent button for bridges (relaying is now the core function).

## Later: SMS (not in this phase)
- Android only. iOS lets no app intercept or send SMS.
- Middleman becomes the **default SMS app** (RoleManager.ROLE_SMS). The default app is the only one that receives texts first.
  It sends and receives through the carrier with SmsManager, so no SMS provider or registered numbers are needed.
- The cost: the default SMS app must be a complete messaging app (threads, MMS, notifications, the system message store),
  because it replaces Google Messages. It can't hand texts on to another messaging app; Android allows exactly one.
- Then a texter doesn't need the app at all. Texts from someone in an active mediation go to Middleman instead of the inbox,
  and Middleman's paraphrase goes back out as SMS from the starter's own number.
- Google Play allows SMS permissions only for apps that really are the default SMS handler. Declaration form required.

## v2 status
- [x] shared: relay model (`room`, `relayFrom`, `deliveredAs`, `withheld`, `Ending`), invite-link parsing; readiness removed
- [x] server: relay, withholding, per-person "settled" judgment, resolution, expiry sweeper, replacement by device pair,
      cascading deletion with secure_delete, `/j/<code>` web route, `assetlinks.json`
- [x] mediators: heuristic and LLM prompt rewritten for relaying, withholding and settledness
- [x] UI: single room, invite link copy, expiry picker, "what they heard", ended screen; joint room and timeouts removed
- [x] Android App Links for `https://middleman.hereliesaz.com/j/*`; web reads its own path
- [ ] Set `ANDROID_CERT_SHA256` on the server once the Play signing key exists, or App Links won't verify
- [ ] SMS phase (default SMS app)

## v2 review
- `:shared:jvmTest` 7/7, `:server:test` 14/14, including the shipped client streaming a mediation to its RESOLVED frame.
- Android debug and release builds pass; web compiles.
- Desktop screenshot against a live server: relay labels, "not passed on", and the header copy render correctly. The withheld
  reason was shown twice, so the duplicate under the message was cut to a label.
- "Settled" state is held in memory and resets on server restart, so judgment has to be earned again. That's deliberate.
