enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")

rootProject.name = "Middleman"

pluginManagement {
    repositories {
        google()
        // Google-hosted mirror of Maven Central, tried first: Central rate-limits shared CI egress.
        maven("https://maven-central.storage-download.googleapis.com/maven2/")
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        maven("https://maven-central.storage-download.googleapis.com/maven2/")
        mavenCentral()
    }
}

// shared     — domain model, clean-fight rules, readiness, API client (all targets)
// composeApp — Compose Multiplatform UI (Android library, iOS framework, desktop, wasm)
// androidApp — the Play Store application shell
// server     — Ktor backend: sessions, privacy sanitization, mediator providers
include(":shared", ":composeApp", ":androidApp", ":server")
