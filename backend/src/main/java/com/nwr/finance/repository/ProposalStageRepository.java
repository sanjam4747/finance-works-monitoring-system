package com.nwr.finance.repository;

import com.nwr.finance.entity.ProposalStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProposalStageRepository extends JpaRepository<ProposalStage, Long> {
    Optional<ProposalStage> findByStageName(String stageName);
    boolean existsByStageName(String stageName);
}
