package com.loganalyzer.controller;

import com.loganalyzer.model.*;
import com.loganalyzer.service.LogAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
@Slf4j
public class LogAnalysisController {

    private final LogAnalysisService logAnalysisService;

    @PostMapping("/analyze")
    public ResponseEntity<LogAnalysisResult> analyzeSingle(
            @Valid @RequestBody LogRequest request) {
        return ResponseEntity.ok(logAnalysisService.analyzeSingle(request));
    }

    @PostMapping("/analyze/batch")
    public ResponseEntity<BatchAnalysisResponse> analyzeBatch(
            @Valid @RequestBody BatchLogRequest batchRequest) {
        return ResponseEntity.ok(logAnalysisService.analyzeBatch(batchRequest));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP", "service", "AI Log Analyzer", "version", "1.0.0"));
    }
}
