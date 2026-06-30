package com.nwr.finance.controller;

import com.nwr.finance.dto.LoginRequest;
import com.nwr.finance.dto.LoginResponse;
import com.nwr.finance.entity.User;
import com.nwr.finance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Simple plain-text password check (demo system)
            if (user.getPassword().equals(request.getPassword())) {
                String token = "fwms-token-" + user.getUsername() + "-" + user.getRole().name();
                LoginResponse response = new LoginResponse(
                        token,
                        user.getUsername(),
                        user.getRole().name(),
                        user.getFullName() != null ? user.getFullName() : user.getUsername(),
                        "Login successful"
                );
                return ResponseEntity.ok(response);
            }
        }

        return ResponseEntity.status(401)
                .body(new LoginResponse(null, null, null, null, "Invalid username or password"));
    }
}
