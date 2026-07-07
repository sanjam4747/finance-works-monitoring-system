package com.nwr.finance.repository;

import com.nwr.finance.entity.Proposal;
import com.nwr.finance.entity.ProposalAuditLog;
import com.nwr.finance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalAuditLogRepository extends JpaRepository<ProposalAuditLog, Long> {
    List<ProposalAuditLog> findByProposalOrderByTimestampDesc(Proposal proposal);
    List<ProposalAuditLog> findByActorOrderByTimestampDesc(User actor);
}
