package com.nwr.finance.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private Long id;
    private Long proposalId;
    private String proposalNumber;
    private String departmentName;
    private String title;
    private String message;
    private String type;
    private boolean isRead;
    private LocalDateTime timestamp;
}
