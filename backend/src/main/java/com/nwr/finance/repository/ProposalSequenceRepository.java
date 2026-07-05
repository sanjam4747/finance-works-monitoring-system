package com.nwr.finance.repository;

import com.nwr.finance.entity.ProposalSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProposalSequenceRepository extends JpaRepository<ProposalSequence, Integer> {

    /**
     * Pessimistic write lock ensures only one transaction at a time can
     * increment the sequence, preventing duplicate proposal numbers under
     * concurrent load.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ps FROM ProposalSequence ps WHERE ps.year = :year")
    Optional<ProposalSequence> findByYearForUpdate(@Param("year") Integer year);
}
