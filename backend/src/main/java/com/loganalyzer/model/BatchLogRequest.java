package com.loganalyzer.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class BatchLogRequest {

    @NotEmpty(message = "Batch cannot be empty")
    @Size(max = 20, message = "Maximum 20 logs per batch")
    @Valid
    private List<LogRequest> logs;

    private boolean parallel = true;
}
