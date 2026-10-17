package com.loganalyzer.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LogRequest {

    @NotBlank(message = "Log text cannot be empty")
    @Size(min = 10, max = 50000, message = "Log must be between 10 and 50,000 characters")
    private String logText;

    private String source;
    private String logType;
}
