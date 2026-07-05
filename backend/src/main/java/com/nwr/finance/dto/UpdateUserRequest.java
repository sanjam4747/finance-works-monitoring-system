package com.nwr.finance.dto;

import com.nwr.finance.entity.UserRole;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private String fullName;
    private String email;
    private UserRole role;

    // Phase 1: Department assignment
    private Long departmentId;

    // Optional: provide a new password; null means keep existing
    private String password;
}
