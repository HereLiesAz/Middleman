package com.hereliesaz.middleman

import android.app.Activity
import com.hereliesaz.aznavrail.updates.AzUpdateChecker

/** Checks the installed distribution's official update source. */
internal fun checkAppUpdate(activity: Activity) {
    AzUpdateChecker.check(activity, "HereLiesAz/Middleman")
}
