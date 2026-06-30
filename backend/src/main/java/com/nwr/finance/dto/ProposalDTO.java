package com.nwr.finance.dto;

import com.nwr.finance.entity.ProposalStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

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

    // Product fields (Change 1)
    private String productName;
    private Integer productQuantity;
    private BigDecimal offeredPrice;
    private BigDecimal marketPrice;
    private BigDecimal priceDifference; // computed: marketPrice - offeredPrice
}
