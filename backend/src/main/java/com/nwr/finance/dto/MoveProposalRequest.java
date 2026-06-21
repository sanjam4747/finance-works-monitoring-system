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
}
