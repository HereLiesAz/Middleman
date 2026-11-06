package com.hereliesaz.middleman.sms

import android.Manifest
import android.app.role.RoleManager
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Telephony
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.core.content.ContextCompat
import com.hereliesaz.middleman.TextBridge
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Android's [TextBridge]. "Ready" means Middleman is the default messaging app, the only way Android lets
 * one app receive texts first and keep them from the rest. Create it in `onCreate`, before the activity starts.
 */
class AndroidTextBridge(private val activity: ComponentActivity) : TextBridge {
    private val _ready = MutableStateFlow(isDefault())
    override val ready: StateFlow<Boolean> = _ready

    private val notifications = activity.registerForActivityResult(ActivityResultContracts.RequestPermission()) { }
    private val role = activity.registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        refresh()
        if (_ready.value && Build.VERSION.SDK_INT >= 33 && !granted(Manifest.permission.POST_NOTIFICATIONS)) {
            notifications.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    /** Call when the activity returns to the foreground: the user may have changed the default in Settings. */
    fun refresh() { _ready.value = isDefault() }

    private fun isDefault() = Telephony.Sms.getDefaultSmsPackage(activity) == activity.packageName
    private fun granted(permission: String) = ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED

    override fun requestReady() {
        val intent = if (Build.VERSION.SDK_INT >= 29) {
            activity.getSystemService(RoleManager::class.java).createRequestRoleIntent(RoleManager.ROLE_SMS)
        } else {
            Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT).putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, activity.packageName)
        }
        role.launch(intent)
    }

    override suspend fun open(number: String, theirName: String, inviteCode: String, starterName: String) {
        SmsRuntime.bridge(activity).open(number, theirName, inviteCode, SmsRuntime.deviceIdFor(activity, number), starterName)
    }

    @Composable override fun Messages(onBack: () -> Unit) = MessagesScreen(onBack)
}
