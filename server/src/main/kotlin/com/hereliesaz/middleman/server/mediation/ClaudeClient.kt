package com.hereliesaz.middleman.server.mediation

import com.anthropic.client.AnthropicClient
import com.anthropic.client.okhttp.AnthropicOkHttpClient
import com.anthropic.models.messages.MessageCreateParams
import com.anthropic.models.messages.OutputConfig
import com.anthropic.models.messages.StopReason
import kotlinx.coroutines.future.await
import java.time.Duration

/**
 * Anthropic Claude via the official Java SDK. Thinking is adaptive by default on current models;
 * effort is the depth control. A refusal throws, which [FallbackMediator] turns into a heuristic reply.
 *
 * Uses the SDK's async client so a coroutine timeout actually cancels the request instead of
 * waiting on a blocked thread; the HTTP timeout bounds it independently.
 */
class ClaudeClient(
    apiKey: String,
    private val model: String,
    private val effort: OutputConfig.Effort,
) : LlmClient {
    override val name = "claude"
    private val client: AnthropicClient = AnthropicOkHttpClient.builder().apiKey(apiKey).timeout(Duration.ofSeconds(30)).maxRetries(0).build()

    override suspend fun complete(system: String, user: String, json: Boolean): String {
        val params = MessageCreateParams.builder()
            .model(model)
            .maxTokens(16000L)
            .system(system)
            .outputConfig(OutputConfig.builder().effort(effort).build())
            .addUserMessage(if (json) "$user\n\nRespond with the JSON object only." else user)
            .build()
        val message = client.async().messages().create(params).await()
        check(message.stopReason().orElse(null) != StopReason.REFUSAL) { "Claude declined the request" }
        return message.content().mapNotNull { block -> block.text().orElse(null)?.text() }.joinToString("")
    }
}
