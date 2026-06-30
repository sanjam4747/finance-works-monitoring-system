package com.nwr.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateProposalRequest {

    @NotBlank(message = "Proposal title is required")
    private String proposalTitle;

    @NotNull(message = "Department is required")
    private Long departmentId;

    private String remarks;

    // Product fields (Change 1) — all optional
    private String productName;

    @Positive(message = "Product quantity must be positive")
    private Integer productQuantity;

    @Positive(message = "Offered price must be positive")
    private BigDecimal offeredPrice;

    @Positive(message = "Market price must be positive")
    private BigDecimal marketPrice;
}
