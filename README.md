# Middleman

A mediator for people in conflict. Couples, families, housemates, co-founders: two is the minimum it takes to fight; there is no maximum.

Everyone talks to Middleman alone first. Middleman listens for the need under the words, shows each person where they differ and where they meet, and opens the shared room only once everyone has been heard. In the shared room it still stands between you: a message that would wound gets held back and returned to its author with a better way to say it. Nobody else ever sees it.

## How it works

- **Private rooms.** Each participant has a room only they and Middleman can read. The server never sends one person's private words to another device, and never gives them to the AI model either: across rooms, only abstracted needs travel.
- **Contrastruction.** Each reply validates first, separates the *content* argument (what happened) from the *feelings* argument (what it meant), names likely misreadings without accusation, marks the area of contrast, constructs common ground, and asks one clarifying question.
- **Bridges, with consent.** Middleman may draft a message (care, then the vulnerable truth, then reassurance) that it could deliver to the others on your behalf. Nothing is sent unless you tap *Send it, in my name*.
- **The joint room is gated.** It opens when everyone has spoken at least twice, everyone has a named need, and the readiness score reaches 70: de-escalation 35%, empathy 40%, shared goals 25%. If someone new joins, it closes again until they've been heard.
- **Clean-fight rules** (after Ze Frank, *How to Fight as a Couple*). Generalizations ("always", "never") and dragging in old battles are flagged. Weaponized swearing, threats to leave, and contempt are **held** in the joint room.
- **Timeouts.** Anyone can call one: sixty seconds of box breathing on every screen, and nobody can post until it ends.

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

Start a mediation on one device, read the six-character code aloud, and join from the others.

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
- Held messages are stored with `visibleTo` set to their author and are filtered out of every other participant's view.

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

The server suite drives the app's own `MiddlemanClient`, including the live stream, against the real routes. It also checks that private words never reach another participant's view, held messages stay held, bridges need consent, and newcomers re-lock the joint room.
