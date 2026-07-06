package com.nwr.finance.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProposalAuditLogDTO {
    private Long id;
    private Long proposalId;
    private String action;
    private String remarks;
    private LocalDateTime timestamp;
    private String actorUsername;
    private String actorFullName;
    private String departmentName;
}
