package com.nwr.finance.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentPerformanceDTO {
    private Long departmentId;
    private String departmentName;
    private Long totalProposals;
    private Long completedProposals;
    private Double averageProcessingDays;
}
