package com.nwr.finance.service;

import com.nwr.finance.dto.DepartmentDTO;
import com.nwr.finance.entity.Department;
import com.nwr.finance.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DepartmentDTO getDepartmentById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
        return toDTO(dept);
    }

    public DepartmentDTO toDTO(Department department) {
        return new DepartmentDTO(department.getId(), department.getName());
    }
}
