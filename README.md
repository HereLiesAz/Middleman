# Middleman

Starting a mediation is the gentle alternative to blocking someone. It says: *I don't want to hear from you until you can treat me with respect. You can still reach me, but only through Middleman.*

Everyone involved (two people, or a whole family) talks only to Middleman, each in their own room. Middleman is the only channel between them, and it is the timeout. When someone wants the others to hear something, Middleman tells them, in its own words: it keeps the substance and strips the cruelty. When it judges that everyone no longer needs a buffer, the mediation ends and every word of it is deleted.

## How it works

- **A link, not a block.** Whoever asks for space gets a link (`https://middleman.hereliesaz.com/j/<code>`) to send. On Android it opens the app; anywhere else, the web app.
- **One room each.** Nobody sees anyone else's room. The server never sends one person's words to another device, and never gives them to the AI either. Across rooms only abstractions travel: named needs, a one-line perspective, and relays.
- **Relaying is paraphrase.** Middleman always passes on what's meant for the others, rewritten so it can be heard: no insults, no "always/never" verdicts, no threats, no old battles (Ze Frank's clean-fight rules). The sender sees exactly what was delivered. A message that's nothing but an attack isn't delivered, and Middleman says what it would carry instead.
- **Contrastruction** shapes every reply: validate first, separate what it's about from what it's *actually* about, name likely misreadings without blame, mark where people differ and where they meet, then ask one question.
- **Middleman decides when it's over.** Not the person who asked for space; sometimes they're the one in the wrong. Resolution needs everyone heard at least twice and everyone judged settled.
- **Nothing is kept.** On resolution, on the optional expiry the starter sets (1, 3, 7 or 30 days), or when the same people start a new mediation, the session, its messages and its tokens are deleted. Everyone gets a closing note; apps keep it in memory only.

## Layout

~~~
shared/      Kotlin Multiplatform: domain model, clean-fight rules, readiness scoring, typed API client
composeApp/  Compose Multiplatform UI: Android library, iOS framework, desktop (JVM), web (Wasm)
androidApp/  The Play Store application (com.hereliesaz.middleman)
iosApp/      SwiftUI shell around the shared UI (see iosApp/README.md)
server/      Ktor: sessions, per-viewer sanitization, mediators, SQLite, WebSocket push
~~~

## Run it

Requirements: JDK 21. The Android build also needs an Android SDK (`local.properties` or `ANDROID_HOME`).

~~~bash
./gradlew :server:run                     # http://localhost:8080
./gradlew :composeApp:run                 # desktop app
./gradlew :composeApp:wasmJsBrowserDevelopmentRun   # web app
./gradlew :androidApp:installDebug        # Android; the emulator reaches the host at 10.0.2.2:8080
~~~

Start a mediation on one device and send the link; open it on the others.

## Server configuration

All settings come from environment variables.

| Variable            | Default              | Meaning |
|---------------------|----------------------|---------|
| `PORT`              | `8080`               | HTTP port |
| `MIDDLEMAN_DB`      | `data/middleman.db`  | SQLite file |
| `MEDIATOR`          | `heuristic`          | `heuristic`, `gemini`, or `claude` |
| `GEMINI_API_KEY`    |                      | Required for `gemini` |
| `GEMINI_MODEL`      | `gemini-3.8-flash`   | |
| `ANTHROPIC_API_KEY` |                      | Required for `claude` |
| `CLAUDE_MODEL`      | `claude-opus-5-5`    | |
| `CLAUDE_EFFORT`     | `medium`             | `low` … `max` |
| `CORS_ORIGINS`      | any                  | Comma-separated origins allowed for the web app |
| `PUBLIC_URL`        | `https://middleman.hereliesaz.com` | Base of shareable invite links |
| `WEB_ROOT`          |                      | Built web app (`composeApp/build/dist/wasmJs/productionExecutable`) to serve, including `/j/<code>` |
| `ANDROID_CERT_SHA256` |                    | Comma-separated signing-certificate fingerprints, published in `/.well-known/assetlinks.json` so invite links open the Android app |
| `APPLE_APP_IDS`     |                      | Comma-separated `TEAMID.bundleid` (e.g. `ABCDE12345.com.hereliesaz.middleman`), published in `/.well-known/apple-app-site-association` so invite links open the iOS app |

The heuristic mediator works offline, and it's the floor under both AI providers: a timeout, an error, or a refusal from the model falls back to it, so a reply always arrives.

Docker:

~~~bash
docker build -t middleman .
~~~

~~~bash
docker run -p 8080:8080 -v middleman-data:/data -e MEDIATOR=claude -e ANTHROPIC_API_KEY=… middleman
~~~

## Privacy

- Session tokens are random 256-bit values. The server stores only their SHA-256 hashes.
- On Android, the token is kept in private preferences and excluded from cloud backup and device transfer.
- Apps never cache session contents; they re-fetch them.
- Rooms are per participant; a view never includes another person's room.
- Deleting a session cascades to its device index and tokens, and SQLite's `secure_delete` overwrites the freed pages.
- "The same people" is decided by anonymous per-install device ids, never by names, phone numbers or accounts.

## Releasing to Google Play

~~~bash
MIDDLEMAN_KEYSTORE=/path/release.jks \
MIDDLEMAN_KEYSTORE_PASSWORD=… MIDDLEMAN_KEY_ALIAS=… MIDDLEMAN_KEY_PASSWORD=… \
./gradlew :androidApp:bundleRelease -Pmiddleman.server=https://your-server
~~~

The output is `androidApp/build/outputs/bundle/release/androidApp-release.aab`. `versionCode` and `versionName` come from `version.properties`. Release builds are minified with R8 and forbid cleartext traffic.

## Tests

~~~bash
./gradlew :shared:jvmTest :server:test
~~~

The server suite drives the app's own `MiddlemanClient`, including the live stream to the final "resolved" frame, against the real routes. It also checks that private words stay private, relays are paraphrased rather than forwarded, pure abuse is withheld, one settled person isn't resolution, a new mediation between the same people deletes the old one, and expiry deletes.

## SMS (Android)

Android only; iOS lets no app handle texts. Starting a mediation takes an optional number, so the other person needs no app.

- **Making it work.** The sender must make Middleman their default messaging app (the only way Android lets one app receive texts first). Without it, the number field offers to ask.
- **How it carries them.** The starter's phone joins its own mediation as a second participant standing in for the texter. Their texts are said in that participant's room. Whatever Middleman says there is texted back from the starter's own number, each prefixed `Middleman:` so it can't pass for the starter. The number never reaches the server; it sees a name and a device id that is a hash of the starter's device and the number.
- **Nothing is kept.** Texts from someone in a mediation are written nowhere on the phone. The bridge is forgotten when the mediation ends. Texts from anyone else are filed in the system inbox like any messaging app.
- **Messaging screens.** Conversation list, thread and a compose box over the system message store, with contact names, sent and delivered marks (`✓`, `✗ not sent`), and picture messages.
- **Picture messages (MMS).** The binary format is read and written by `shared/.../mms/MmsPdu.kt`, tested against hand-built PDUs. Middleman downloads incoming pictures, files them in the system store, and sends pictures shrunk to about 280 KB. A picture from someone in a mediation is not carried; they are told Middleman only carries words. Sent messages carry no SMIL layout part; some carriers may want one.
- **Not tested on a device.** The bridge and the MMS codec are tested. The default-app role, carrier sending, downloading and sending pictures, and the foreground service need a phone and a real carrier.
- **Play.** SMS permissions are allowed only for apps that really are the default handler, and need Google's Permissions Declaration Form. A draft of the answers is in `docs/PLAY_SMS_DECLARATION.md`.
- **Limit.** Android caps the keep-alive service at a few hours at a stretch. If the system stops it, the next text or opening the app resumes the bridge.
