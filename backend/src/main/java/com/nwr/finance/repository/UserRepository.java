package com.nwr.finance.repository;

import com.nwr.finance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    
    java.util.List<User> findByDepartment_IdAndRoleAndIsActiveTrue(Long departmentId, com.nwr.finance.entity.UserRole role);
    java.util.List<User> findByDepartment_IdAndIsActiveTrue(Long departmentId);
}
