package com.nwr.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalItemDTO {
    private Long id;
    private String itemName;
    private Integer quantity;
    private String unit;
    private BigDecimal offeredPrice;
    private BigDecimal marketPrice;
    private BigDecimal priceDifference;  // computed: market - offered
    private String itemRemarks;
    private Integer sortOrder;
}
