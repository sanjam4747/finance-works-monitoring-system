package com.nwr.finance.dto;

import com.nwr.finance.entity.ProposalStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalDTO {
    private Long id;
    private String proposalNumber;
    private String proposalTitle;
    private DepartmentDTO department;
    private ProposalStageDTO currentStage;
    private ProposalStatus status;
    private LocalDate submissionDate;
    private LocalDate completionDate;
    private String remarks;
    private Long totalDaysSpent;

    // Phase 1: Who created the proposal
    private String createdByUsername;
    private String createdByFullName;

    // Phase 5: Currently assigned officer
    private String assignedToUsername;
    private String assignedToFullName;
    private LocalDateTime assignedAt;

    // Phase 1: Multi-item product list (replaces flat product_* fields)
    private List<ProposalItemDTO> items;

    // Convenience computed totals across all items
    private Long totalItemCount;
    private java.math.BigDecimal totalOfferedPrice;
    private java.math.BigDecimal totalMarketPrice;
    private java.math.BigDecimal totalPriceDifference;
}
