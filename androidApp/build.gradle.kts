import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.compose.compiler)
}

/** Version comes from the repo's canonical version.properties (major.minor.patch.build). */
val version = Properties().apply { rootProject.file("version.properties").inputStream().use(::load) }
fun v(key: String) = version.getProperty(key, "0").toInt()

android {
    namespace = "com.hereliesaz.middleman"
    compileSdk = libs.versions.android.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "com.hereliesaz.middleman"
        minSdk = libs.versions.android.minSdk.get().toInt()
        targetSdk = libs.versions.android.targetSdk.get().toInt()
        versionCode = v("versionMajor") * 1_000_000 + v("versionMinor") * 10_000 + v("versionPatch") * 100 + v("versionBuild") % 100
        versionName = "${v("versionMajor")}.${v("versionMinor")}.${v("versionPatch")}"
    }

    buildFeatures { buildConfig = true }

    // Release signing reads from the environment so the keystore never touches the repo.
    val keystore = System.getenv("MIDDLEMAN_KEYSTORE")
    signingConfigs {
        if (keystore != null) create("release") {
            storeFile = file(keystore)
            storePassword = System.getenv("MIDDLEMAN_KEYSTORE_PASSWORD")
            keyAlias = System.getenv("MIDDLEMAN_KEY_ALIAS")
            keyPassword = System.getenv("MIDDLEMAN_KEY_PASSWORD")
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            buildConfigField("String", "DEFAULT_SERVER", "\"http://10.0.2.2:8080\"")
            manifestPlaceholders["cleartext"] = "true"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            buildConfigField("String", "DEFAULT_SERVER", "\"${providers.gradleProperty("middleman.server").getOrElse("https://middleman.hereliesaz.com")}\"")
            manifestPlaceholders["cleartext"] = "false"
            signingConfigs.findByName("release")?.let { signingConfig = it }
        }
    }
}

kotlin { jvmToolchain(21) }

dependencies {
    implementation(projects.composeApp)
    implementation(libs.androidx.activity.compose)
}
