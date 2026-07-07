package com.nwr.finance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReassignProposalRequest {
    @NotNull(message = "Target user ID is required")
    private Long assignedToUserId;
    
    private String remarks;
}
