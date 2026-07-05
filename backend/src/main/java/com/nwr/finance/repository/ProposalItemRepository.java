package com.nwr.finance.repository;

import com.nwr.finance.entity.Proposal;
import com.nwr.finance.entity.ProposalItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalItemRepository extends JpaRepository<ProposalItem, Long> {

    List<ProposalItem> findByProposalOrderBySortOrderAsc(Proposal proposal);

    @Modifying
    @Query("DELETE FROM ProposalItem pi WHERE pi.proposal = :proposal")
    void deleteByProposal(@Param("proposal") Proposal proposal);
}
