package com.loganalyzer.model;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class BatchAnalysisResponse {
    private List<LogAnalysisResult> results;
    private int totalLogs;
    private int successCount;
    private int failureCount;
    private long totalProcessingTimeMs;
    private LocalDateTime processedAt;
    private int criticalCount;
    private int highCount;
}
