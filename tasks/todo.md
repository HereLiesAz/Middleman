# Middleman — Compose Multiplatform rewrite

## Decisions
- Kotlin Multiplatform monorepo. Package root `com.hereliesaz.middleman`.
- Targets: Android (Play Store build), iOS, Desktop (JVM), Web (Wasm).
- Backend: Ktor server, same repo. Holds API keys. Enforces per-partner sanitization server-side.
- AI: `Mediator` interface; `GeminiMediator`, `ClaudeMediator`, `HeuristicMediator` (offline fallback). Selected by server config.
- TS app, screenshots, `.aistudio/` deleted after domain logic is ported.

## Modules
~~~
shared/     commonMain: models (kotlinx.serialization), mediationRules, readiness scoring, scenarios, API client (Ktor client)
composeApp/ Compose UI: private room, joint room, readiness meter, bridge notes, timeout, intent composer
server/     Ktor: sessions, auth-lite pairing, sanitization, Mediator providers, WebSocket push
androidApp/ Play-specific: signing config, release bundle (AAB), Play Integrity hook point
iosApp/     Xcode wrapper
~~~

## Steps
- [ ] 1. Gradle scaffold (version catalog, KMP + Compose plugins), wrapper, CI build
- [ ] 2. Port types → `shared` models; port `mediationRules.ts` + its tests → commonTest
- [ ] 3. Ktor server: routes mirroring current API, sanitization, in-memory store (persistence later)
- [ ] 4. `Mediator` interface + Heuristic, Gemini, Claude impls; contrastruction prompt ported
- [ ] 5. Compose UI: monochrome, dark, dramatic. Screens: Onboarding/pair → Private room → Joint room; sheets for timeout, bridge notes, profile
- [ ] 6. Android release config: AAB, signing via env, R8, `applicationId com.hereliesaz.middleman`
- [ ] 7. Delete TS/PWA + debris; rewrite README
- [ ] 8. Verify: `./gradlew check`, server tests, desktop + wasm build, Android assembleRelease (unsigned)

## Open questions
- Pairing: invite code/link between two real devices, or keep the demo "switch partner" toggle?
- Persistence for server: in-memory first, or Postgres/SQLite now?
- Keep the canned scenarios (anniversary, chores, in-laws) as demo content?

## Review
(pending)
