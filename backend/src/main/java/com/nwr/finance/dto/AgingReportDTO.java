package com.nwr.finance.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgingReportDTO {
    private List<ProposalDTO> over7Days;
    private List<ProposalDTO> over15Days;
    private List<ProposalDTO> over30Days;
}
