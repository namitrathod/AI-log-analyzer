package com.loganalyzer.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LogAnalysisResult {
    private int index;
    private String source;
    private String summary;
    private String rootCause;
    private String suggestedFix;
    private String severity;
    private boolean success;
    private String errorMessage;
    private long processingTimeMs;
}
