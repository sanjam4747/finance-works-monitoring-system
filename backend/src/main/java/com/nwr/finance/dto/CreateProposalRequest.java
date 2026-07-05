package com.nwr.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateProposalRequest {

    @NotBlank(message = "Proposal title is required")
    private String proposalTitle;

    @NotNull(message = "Department is required")
    private Long departmentId;

    private String remarks;

    // Phase 1: Zero or more items (optional — proposal can have no items)
    private List<ProposalItemRequest> items;
}
