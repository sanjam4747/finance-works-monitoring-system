package com.nwr.finance.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalMovementDTO {
    private Long id;
    private Long proposalId;
    private ProposalStageDTO fromStage;
    private ProposalStageDTO toStage;
    private LocalDateTime enteredAt;
    private LocalDateTime exitedAt;
    private Long daysSpent;
    private String remarks;
    private boolean current;

    // Phase 1: Actor tracking
    private String movedByUsername;
    private String movedByFullName;
}
