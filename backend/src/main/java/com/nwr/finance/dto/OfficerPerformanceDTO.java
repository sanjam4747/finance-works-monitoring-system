package com.nwr.finance.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OfficerPerformanceDTO {
    private Long userId;
    private String fullName;
    private String username;
    private String departmentName;
    private long currentlyAssigned;
    private long totalCreated;
    private long totalForwarded;
    private long totalReturned;
    private long totalApproved;
    private long totalCompleted;
    private long totalComments;
    private double averageProcessingDays;
    private LocalDateTime lastActivityAt;
}
