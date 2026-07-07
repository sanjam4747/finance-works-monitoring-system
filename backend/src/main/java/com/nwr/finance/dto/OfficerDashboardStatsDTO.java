package com.nwr.finance.dto;

import lombok.Data;

@Data
public class OfficerDashboardStatsDTO {
    private long assignedToMe;
    private long pendingReviews;
    private long returnedToMe;
    private long completedToday;
}
