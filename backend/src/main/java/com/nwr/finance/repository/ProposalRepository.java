package com.nwr.finance.repository;

import com.nwr.finance.entity.Department;
import com.nwr.finance.entity.Proposal;
import com.nwr.finance.entity.ProposalStage;
import com.nwr.finance.entity.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {

    Optional<Proposal> findByProposalNumber(String proposalNumber);

    boolean existsByProposalNumber(String proposalNumber);

    List<Proposal> findByDepartment(Department department);

    List<Proposal> findByStatus(ProposalStatus status);

    List<Proposal> findByCurrentStage(ProposalStage stage);

    @Query("SELECT p FROM Proposal p WHERE " +
           "(:search IS NULL OR LOWER(p.proposalNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(p.proposalTitle) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:departmentId IS NULL OR p.department.id = :departmentId) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:stageId IS NULL OR p.currentStage.id = :stageId)")
    List<Proposal> findWithFilters(
            @Param("search") String search,
            @Param("departmentId") Long departmentId,
            @Param("status") ProposalStatus status,
            @Param("stageId") Long stageId
    );

    long countByStatus(ProposalStatus status);

    @Query("SELECT COUNT(p) FROM Proposal p WHERE p.status NOT IN ('COMPLETED', 'REJECTED', 'APPROVED')")
    long countActive();
}
