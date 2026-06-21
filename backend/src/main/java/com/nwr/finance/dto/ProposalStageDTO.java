package com.nwr.finance.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalStageDTO {
    private Long id;
    private String stageName;
    private Integer sequenceNumber;
}
