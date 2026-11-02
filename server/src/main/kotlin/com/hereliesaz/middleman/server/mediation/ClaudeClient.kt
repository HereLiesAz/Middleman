package com.hereliesaz.middleman.server.mediation

import com.anthropic.client.AnthropicClient
import com.anthropic.client.okhttp.AnthropicOkHttpClient
import com.anthropic.models.messages.MessageCreateParams
import com.anthropic.models.messages.OutputConfig
import com.anthropic.models.messages.StopReason
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Anthropic Claude via the official Java SDK. Thinking is adaptive by default on current models;
 * effort is the depth control. A refusal throws, which [FallbackMediator] turns into a heuristic reply.
 */
class ClaudeClient(
    apiKey: String,
    private val model: String,
    private val effort: OutputConfig.Effort,
) : LlmClient {
    override val name = "claude"
    private val client: AnthropicClient = AnthropicOkHttpClient.builder().apiKey(apiKey).build()

    override suspend fun complete(system: String, user: String, json: Boolean): String = withContext(Dispatchers.IO) {
        val params = MessageCreateParams.builder()
            .model(model)
            .maxTokens(16000L)
            .system(system)
            .outputConfig(OutputConfig.builder().effort(effort).build())
            .addUserMessage(if (json) "$user\n\nRespond with the JSON object only." else user)
            .build()
        val message = client.messages().create(params)
        check(message.stopReason().orElse(null) != StopReason.REFUSAL) { "Claude declined the request" }
        message.content().mapNotNull { block -> block.text().orElse(null)?.text() }.joinToString("")
    }
}
