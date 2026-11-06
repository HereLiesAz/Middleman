package com.hereliesaz.middleman

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.hereliesaz.middleman.api.inviteCodeFrom
import com.hereliesaz.middleman.sms.AndroidTextBridge
import com.hereliesaz.middleman.ui.App

class MainActivity : ComponentActivity() {
    private lateinit var texts: AndroidTextBridge

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge(SystemBarStyle.dark(android.graphics.Color.BLACK), SystemBarStyle.dark(android.graphics.Color.BLACK))
        super.onCreate(savedInstanceState)
        texts = AndroidTextBridge(this)
        val invite = intent?.data?.toString()?.let(::inviteCodeFrom)
        setContent { App(AndroidStore(applicationContext), BuildConfig.DEFAULT_SERVER, invite, texts) }
    }

    override fun onResume() {
        super.onResume()
        texts.refresh()
    }
}
