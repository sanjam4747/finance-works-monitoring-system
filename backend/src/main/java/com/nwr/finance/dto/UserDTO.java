package com.nwr.finance.dto;

import com.nwr.finance.entity.UserRole;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private UserRole role;
    private String fullName;
    private String email;
}
