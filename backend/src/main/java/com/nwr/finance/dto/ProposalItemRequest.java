package com.nwr.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Represents a single item within a CreateProposalRequest.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalItemRequest {
    private String itemName;
    private Integer quantity;
    private String unit;
    private BigDecimal offeredPrice;
    private BigDecimal marketPrice;
    private String itemRemarks;
}
