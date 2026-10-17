package com.loganalyzer.service;

import com.loganalyzer.model.*;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.*;

@Service
@Slf4j
public class LogAnalysisService {

    private final AIService aiService;
    private final Bucket rateLimiter;
    private final ExecutorService executorService;

    public LogAnalysisService(AIService aiService,
            @Value("${rate.limit.per.minute:10}") int rateLimit) {
        this.aiService = aiService;
        Bandwidth limit = Bandwidth.classic(
                rateLimit, Refill.greedy(rateLimit, Duration.ofMinutes(1)));
        this.rateLimiter = Bucket.builder().addLimit(limit).build();
        int threads = Math.min(8, Runtime.getRuntime().availableProcessors());
        this.executorService = Executors.newFixedThreadPool(threads);
        log.info("Ready — {} threads, {} req/min", threads, rateLimit);
    }

    public LogAnalysisResult analyzeSingle(LogRequest request) {
        if (!rateLimiter.tryConsume(1)) {
            return LogAnalysisResult.builder()
                    .source(request.getSource()).success(false)
                    .errorMessage("Rate limit exceeded. Please wait and try again.")
                    .severity("UNKNOWN").processingTimeMs(0).build();
        }
        LogAnalysisResult result = aiService.analyzeLog(
                request.getLogText(), request.getSource(), request.getLogType());
        result.setIndex(0);
        return result;
    }

    public BatchAnalysisResponse analyzeBatch(BatchLogRequest batchRequest) {
        List<LogRequest> logs = batchRequest.getLogs();
        if (!rateLimiter.tryConsume(logs.size())) {
            throw new RuntimeException("Rate limit exceeded. Reduce batch size or wait.");
        }
        long startTime = System.currentTimeMillis();
        List<LogAnalysisResult> results = batchRequest.isParallel()
                ? processParallel(logs) : processSequential(logs);
        long totalTime = System.currentTimeMillis() - startTime;
        long successCount = results.stream().filter(LogAnalysisResult::isSuccess).count();
        long criticalCount = results.stream()
                .filter(r -> "CRITICAL".equals(r.getSeverity())).count();
        long highCount = results.stream()
                .filter(r -> "HIGH".equals(r.getSeverity())).count();
        return BatchAnalysisResponse.builder()
                .results(results).totalLogs(logs.size())
                .successCount((int) successCount)
                .failureCount(logs.size() - (int) successCount)
                .totalProcessingTimeMs(totalTime).processedAt(LocalDateTime.now())
                .criticalCount((int) criticalCount).highCount((int) highCount).build();
    }

    private List<LogAnalysisResult> processParallel(List<LogRequest> logs) {
        List<Future<LogAnalysisResult>> futures = IntStream.range(0, logs.size())
                .mapToObj(i -> executorService.submit(() -> {
                    LogAnalysisResult r = aiService.analyzeLog(
                            logs.get(i).getLogText(),
                            logs.get(i).getSource(),
                            logs.get(i).getLogType());
                    r.setIndex(i);
                    return r;
                })).collect(Collectors.toList());

        List<LogAnalysisResult> results = new ArrayList<>();
        for (int i = 0; i < futures.size(); i++) {
            try {
                results.add(futures.get(i).get(90, TimeUnit.SECONDS));
            } catch (TimeoutException e) {
                results.add(errorResult(i, "Timed out"));
            } catch (Exception e) {
                results.add(errorResult(i, "Error: " + e.getMessage()));
            }
        }
        return results;
    }

    private List<LogAnalysisResult> processSequential(List<LogRequest> logs) {
        List<LogAnalysisResult> results = new ArrayList<>();
        for (int i = 0; i < logs.size(); i++) {
            LogAnalysisResult r = aiService.analyzeLog(
                    logs.get(i).getLogText(),
                    logs.get(i).getSource(),
                    logs.get(i).getLogType());
            r.setIndex(i);
            results.add(r);
        }
        return results;
    }

    private LogAnalysisResult errorResult(int index, String message) {
        return LogAnalysisResult.builder().index(index).success(false)
                .errorMessage(message).severity("UNKNOWN").processingTimeMs(0).build();
    }
}
