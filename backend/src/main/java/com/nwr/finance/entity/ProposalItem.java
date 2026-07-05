package com.nwr.finance.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "proposal_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false)
    private Proposal proposal;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "offered_price", precision = 15, scale = 2)
    private BigDecimal offeredPrice;

    @Column(name = "market_price", precision = 15, scale = 2)
    private BigDecimal marketPrice;

    @Column(name = "item_remarks", length = 500)
    private String itemRemarks;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
