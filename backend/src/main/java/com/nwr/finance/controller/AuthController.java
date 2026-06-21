package com.nwr.finance.controller;

import com.nwr.finance.dto.LoginRequest;
import com.nwr.finance.dto.LoginResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        // Simple credential check - admin/admin123
        if ("admin".equals(request.getUsername()) && "admin123".equals(request.getPassword())) {
            LoginResponse response = new LoginResponse(
                    "finance-works-token-2024",
                    request.getUsername(),
                    "ADMIN",
                    "Login successful"
            );
            return ResponseEntity.ok(response);
        }
        // Finance officer login
        if ("finance".equals(request.getUsername()) && "finance123".equals(request.getPassword())) {
            LoginResponse response = new LoginResponse(
                    "finance-works-token-officer-2024",
                    request.getUsername(),
                    "OFFICER",
                    "Login successful"
            );
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(401).body(new LoginResponse(null, null, null, "Invalid credentials"));
    }
}
