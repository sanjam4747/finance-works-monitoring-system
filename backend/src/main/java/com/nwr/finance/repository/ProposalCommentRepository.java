package com.nwr.finance.repository;

import com.nwr.finance.entity.Proposal;
import com.nwr.finance.entity.ProposalComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalCommentRepository extends JpaRepository<ProposalComment, Long> {
    List<ProposalComment> findByProposalOrderByTimestampDesc(Proposal proposal);
}
