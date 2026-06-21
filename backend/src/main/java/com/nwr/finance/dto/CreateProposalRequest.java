package com.nwr.finance.dto;

import com.nwr.finance.entity.ProposalStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateProposalRequest {

    @NotBlank(message = "Proposal number is required")
    private String proposalNumber;

    @NotBlank(message = "Proposal title is required")
    private String proposalTitle;

    @NotNull(message = "Department is required")
    private Long departmentId;

    @NotNull(message = "Initial stage is required")
    private Long initialStageId;

    private String remarks;
}
