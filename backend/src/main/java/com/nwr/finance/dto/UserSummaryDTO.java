package com.nwr.finance.dto;

import lombok.Data;

@Data
public class UserSummaryDTO {
    private Long id;
    private String username;
    private String fullName;
    private String departmentName;
    private String role;
    private long activeProposalCount; // Phase 5: current workload for display
}
