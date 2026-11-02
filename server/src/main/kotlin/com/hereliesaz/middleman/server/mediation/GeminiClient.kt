package com.hereliesaz.middleman.server.mediation

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.client.statement.bodyAsText
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject
import kotlinx.serialization.json.addJsonObject

/** Google Gemini via the generateContent REST endpoint. */
class GeminiClient(
    private val http: HttpClient,
    private val apiKey: String,
    private val model: String,
) : LlmClient {
    override val name = "gemini"

    override suspend fun complete(system: String, user: String, json: Boolean): String {
        val response = http.post("https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent") {
            header("x-goog-api-key", apiKey)
            contentType(ContentType.Application.Json)
            setBody(buildJsonObject {
                putJsonObject("systemInstruction") { putJsonArray("parts") { addJsonObject { put("text", system) } } }
                putJsonArray("contents") {
                    addJsonObject { put("role", "user"); putJsonArray("parts") { addJsonObject { put("text", user) } } }
                }
                if (json) putJsonObject("generationConfig") { put("responseMimeType", "application/json") }
            })
        }
        check(response.status.isSuccess()) { "Gemini ${response.status}: ${response.bodyAsText().take(300)}" }
        return response.body<JsonObject>()["candidates"]!!.jsonArray.first().jsonObject["content"]!!
            .jsonObject["parts"]!!.jsonArray.joinToString("") { it.jsonObject["text"]?.jsonPrimitive?.content.orEmpty() }
    }
}
