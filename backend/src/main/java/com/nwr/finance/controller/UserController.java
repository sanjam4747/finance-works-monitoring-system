package com.nwr.finance.controller;

import com.nwr.finance.dto.UserDTO;
import com.nwr.finance.entity.User;
import com.nwr.finance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only admins can view user list"));
        }
        List<UserDTO> users = userRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    private UserDTO toDTO(User user) {
        return new UserDTO(user.getId(), user.getUsername(), user.getRole(),
                user.getFullName(), user.getEmail());
    }
}
