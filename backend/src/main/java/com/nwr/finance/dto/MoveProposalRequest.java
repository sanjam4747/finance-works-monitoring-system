package com.nwr.finance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MoveProposalRequest {

    @NotNull(message = "Target stage is required")
    private Long toStageId;

    private String remarks;

    // Phase 5: The officer to assign the proposal to after the move
    @NotNull(message = "Assigned officer is required")
    private Long assignedToUserId;
}
