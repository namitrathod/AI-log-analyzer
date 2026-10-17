package com.loganalyzer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.loganalyzer.config.AIConfig;
import com.loganalyzer.model.LogAnalysisResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@Slf4j
@RequiredArgsConstructor
public class AIService {

    private final AIConfig aiConfig;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LogAnalysisResult analyzeLog(String logText, String source, String logType) {
        long startTime = System.currentTimeMillis();
        try {
            HttpRequest request = buildOllamaRequest(logText, logType);

            log.debug("Calling Ollama for source: {}", source);
            HttpResponse<String> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofString());
            long processingTime = System.currentTimeMillis() - startTime;

            if (response.statusCode() != 200) {
                log.error("Ollama error {}: {}", response.statusCode(), response.body());
                return buildErrorResult(source,
                        "Ollama error: HTTP " + response.statusCode(), processingTime);
            }

            return parseOllamaResponse(response.body(), source, processingTime);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return buildErrorResult(source, "Request interrupted", 0);
        } catch (Exception e) {
            log.error("Ollama call failed: {}", e.getMessage(), e);
            return buildErrorResult(source, "Failed to reach Ollama: " + e.getMessage(),
                    System.currentTimeMillis() - startTime);
        }
    }

    private HttpRequest buildOllamaRequest(String logText, String logType) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", aiConfig.getModel());
        body.put("stream", false);

        // Higher token limit + low temperature for consistent JSON output
        ObjectNode options = objectMapper.createObjectNode();
        options.put("num_predict", 500);
        options.put("temperature", 0.1);
        body.set("options", options);

        ArrayNode messages = objectMapper.createArrayNode();
        ObjectNode message = objectMapper.createObjectNode();
        message.put("role", "user");
        message.put("content", buildPrompt(logText, logType));
        messages.add(message);
        body.set("messages", messages);

        return HttpRequest.newBuilder()
                .uri(URI.create(aiConfig.getApiUrl() + "/api/chat"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        objectMapper.writeValueAsString(body)))
                .timeout(Duration.ofSeconds(120))
                .build();
    }

    private LogAnalysisResult parseOllamaResponse(
            String body, String source, long processingTime) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String text = root.path("message").path("content").asText();
            return parseAnalysisJson(text, source, processingTime);
        } catch (Exception e) {
            log.error("Failed to parse Ollama response: {}", e.getMessage());
            return buildErrorResult(source, "Failed to parse response", processingTime);
        }
    }

    private String buildPrompt(String logText, String logType) {
        String typeHint = (logType != null && !logType.isBlank())
                ? "Log type: " + logType + "\n\n" : "";
        return typeHint +
               "Analyze this log/error. Respond ONLY with a JSON object, no extra text.\n\n" +
               "{\"summary\":\"brief description\",\"rootCause\":\"why it happened\"," +
               "\"suggestedFix\":\"how to fix it\",\"severity\":\"HIGH\"}\n\n" +
               "Severity must be: CRITICAL, HIGH, MEDIUM, or LOW\n\n" +
               "Log:\n" + logText;
    }

    private LogAnalysisResult parseAnalysisJson(
            String text, String source, long processingTime) throws Exception {
        String cleaned = text.trim()
                .replaceAll("^```json\\s*", "")
                .replaceAll("^```\\s*", "")
                .replaceAll("\\s*```$", "")
                .trim();

        // Repair truncated JSON if closing brace is missing
        if (!cleaned.endsWith("}")) {
            log.warn("JSON truncated, repairing...");
            int lastQuote = cleaned.lastIndexOf('"');
            cleaned = lastQuote > 0
                    ? cleaned.substring(0, lastQuote + 1) + "}"
                    : cleaned + "}";
        }

        JsonNode analysis = objectMapper.readTree(cleaned);
        return LogAnalysisResult.builder()
                .source(source)
                .summary(analysis.path("summary").asText("No summary available"))
                .rootCause(analysis.path("rootCause").asText("Could not determine"))
                .suggestedFix(analysis.path("suggestedFix").asText("No fix available"))
                .severity(analysis.path("severity").asText("MEDIUM").toUpperCase())
                .success(true)
                .processingTimeMs(processingTime)
                .build();
    }

    private LogAnalysisResult buildErrorResult(
            String source, String message, long processingTime) {
        return LogAnalysisResult.builder()
                .source(source).success(false)
                .errorMessage(message).severity("UNKNOWN")
                .processingTimeMs(processingTime).build();
    }
}
