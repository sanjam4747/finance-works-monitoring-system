package com.nwr.finance.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProposalCommentDTO {
    private Long id;
    private Long proposalId;
    private String commentText;
    private LocalDateTime timestamp;
    private String username;
    private String fullName;
    private String departmentName;
}
