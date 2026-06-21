package com.nwr.finance.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StageDelayDTO {
    private Long stageId;
    private String stageName;
    private Integer sequenceNumber;
    private Double averageDaysSpent;
    private Long proposalCount;
}
