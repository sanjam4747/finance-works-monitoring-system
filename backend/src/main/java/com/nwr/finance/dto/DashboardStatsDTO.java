package com.nwr.finance.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDTO {
    private long totalProposals;
    private long pendingProposals;
    private long completedProposals;
    private long returnedProposals;
    private long approvedProposals;
    private long rejectedProposals;
    private long underReviewProposals;
    private double averageProcessingDays;

    // Department-wise average days (Change 2)
    private double avgExecutiveDepartmentDays;
    private double avgAccountsDepartmentDays;
}
