package com.nwr.finance.repository;

import com.nwr.finance.entity.Proposal;
import com.nwr.finance.entity.ProposalMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalMovementRepository extends JpaRepository<ProposalMovement, Long> {

    List<ProposalMovement> findByProposalOrderByEnteredAtAsc(Proposal proposal);

    List<ProposalMovement> findByProposalOrderByEnteredAtDesc(Proposal proposal);

    @Query("SELECT pm FROM ProposalMovement pm WHERE pm.proposal = :proposal AND pm.exitedAt IS NULL")
    Optional<ProposalMovement> findCurrentMovement(@Param("proposal") Proposal proposal);

    @Query("SELECT AVG(pm.daysSpent) FROM ProposalMovement pm WHERE pm.toStage.id = :stageId AND pm.daysSpent IS NOT NULL")
    Double findAverageDaysSpentAtStage(@Param("stageId") Long stageId);

    @Query("SELECT SUM(pm.daysSpent) FROM ProposalMovement pm WHERE pm.proposal = :proposal AND pm.daysSpent IS NOT NULL")
    Long findTotalDaysSpentForProposal(@Param("proposal") Proposal proposal);

    @Query("SELECT pm FROM ProposalMovement pm WHERE pm.exitedAt IS NULL AND " +
           "DATEDIFF(CURRENT_TIMESTAMP, pm.enteredAt) > :days")
    List<ProposalMovement> findStaleMovements(@Param("days") int days);

    @Query("SELECT pm.proposal FROM ProposalMovement pm WHERE pm.exitedAt IS NULL AND " +
           "DATEDIFF(CURRENT_TIMESTAMP, pm.enteredAt) > :days")
    List<Proposal> findAgingProposals(@Param("days") int days);
}
