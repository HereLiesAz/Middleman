package com.hereliesaz.middleman.sms

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File

/**
 * Hands the phone's messaging service a file to write a downloaded picture message into, or to read an outgoing one
 * from. The service runs in another process and can only use content URIs. Files have random names and are deleted as
 * soon as they've been used.
 */
class MmsFileProvider : ContentProvider() {
    override fun onCreate() = true

    override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor {
        val name = uri.lastPathSegment?.takeIf { '/' !in it && ".." !in it } ?: throw java.io.FileNotFoundException(uri.toString())
        return ParcelFileDescriptor.open(File(dir(context!!), name).apply { parentFile?.mkdirs() }, ParcelFileDescriptor.parseMode(mode))
    }

    override fun query(uri: Uri, projection: Array<out String>?, selection: String?, selectionArgs: Array<out String>?, sortOrder: String?) = null
    override fun getType(uri: Uri) = "application/vnd.wap.mms-message"
    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?) = 0
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?) = 0

    companion object {
        fun dir(context: Context) = File(context.cacheDir, "mms")

        /** A new empty file and the URI the messaging service can reach it by. */
        fun create(context: Context): Pair<File, Uri> {
            val file = File(dir(context), java.util.UUID.randomUUID().toString() + ".dat").apply { parentFile?.mkdirs(); createNewFile() }
            return file to Uri.parse("content://${context.packageName}.mms/${file.name}")
        }
    }
}
