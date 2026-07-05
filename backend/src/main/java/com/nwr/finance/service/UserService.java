package com.nwr.finance.service;

import com.nwr.finance.dto.CreateUserRequest;
import com.nwr.finance.dto.UpdateUserRequest;
import com.nwr.finance.dto.UserDTO;
import com.nwr.finance.entity.Department;
import com.nwr.finance.entity.User;
import com.nwr.finance.repository.DepartmentRepository;
import com.nwr.finance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository       userRepository;
    private final DepartmentRepository departmentRepository;

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return toDTO(user);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public UserDTO createUser(CreateUserRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username '" + request.getUsername() + "' is already taken");
        }

        User user = new User();
        user.setUsername(request.getUsername().trim().toLowerCase());
        user.setPassword(request.getPassword());    // plain text — auth upgrade deferred to Phase 6
        user.setRole(request.getRole());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setIsActive(true);

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            user.setDepartment(dept);
        }

        return toDTO(userRepository.save(user));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public UserDTO updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail()    != null) user.setEmail(request.getEmail());
        if (request.getRole()     != null) user.setRole(request.getRole());

        // Update password only if a new one was provided
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(request.getPassword());
        }

        // Update department
        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            user.setDepartment(dept);
        } else {
            // Explicitly cleared — remove department assignment
            user.setDepartment(null);
        }

        return toDTO(userRepository.save(user));
    }

    // ── Deactivate / Reactivate ───────────────────────────────────────────────

    public UserDTO setActiveStatus(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setIsActive(active);
        return toDTO(userRepository.save(user));
    }

    // ── Delete (hard) ─────────────────────────────────────────────────────────

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        userRepository.delete(user);
    }

    // ── DTO Mapping ───────────────────────────────────────────────────────────

    public UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setRole(user.getRole());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setIsActive(user.getIsActive() != null ? user.getIsActive() : true);

        if (user.getDepartment() != null) {
            dto.setDepartmentId(user.getDepartment().getId());
            dto.setDepartmentName(user.getDepartment().getName());
        }

        return dto;
    }
}
