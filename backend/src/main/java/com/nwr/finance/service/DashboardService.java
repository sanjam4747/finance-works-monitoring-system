package com.nwr.finance.service;

import com.nwr.finance.dto.*;
import com.nwr.finance.entity.*;
import com.nwr.finance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final ProposalRepository proposalRepository;
    private final ProposalMovementRepository movementRepository;
    private final ProposalStageRepository stageRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final ProposalAuditLogRepository auditLogRepository;

    private Department getDepartmentForUser(String username) {
        if (username == null || username.isBlank()) return null;
        return userRepository.findByUsername(username)
                .filter(u -> u.getRole() != UserRole.ADMIN)
                .map(User::getDepartment)
                .orElse(null);
    }

    public DashboardStatsDTO getDashboardStats(String username) {
        Department dept = getDepartmentForUser(username);

        long total = dept == null ? proposalRepository.count() : proposalRepository.countByDepartment(dept);
        long pending = dept == null ? proposalRepository.countByStatus(ProposalStatus.PENDING) : proposalRepository.countByStatusAndDepartment(ProposalStatus.PENDING, dept);
        long completed = dept == null ? proposalRepository.countByStatus(ProposalStatus.COMPLETED) : proposalRepository.countByStatusAndDepartment(ProposalStatus.COMPLETED, dept);
        long returned = dept == null ? proposalRepository.countByStatus(ProposalStatus.RETURNED) : proposalRepository.countByStatusAndDepartment(ProposalStatus.RETURNED, dept);
        long approved = dept == null ? proposalRepository.countByStatus(ProposalStatus.APPROVED) : proposalRepository.countByStatusAndDepartment(ProposalStatus.APPROVED, dept);
        long rejected = dept == null ? proposalRepository.countByStatus(ProposalStatus.REJECTED) : proposalRepository.countByStatusAndDepartment(ProposalStatus.REJECTED, dept);
        long underReview = dept == null ? proposalRepository.countByStatus(ProposalStatus.UNDER_REVIEW) : proposalRepository.countByStatusAndDepartment(ProposalStatus.UNDER_REVIEW, dept);

        List<Proposal> proposals = dept == null ? proposalRepository.findAll() : proposalRepository.findByDepartment(dept);
        double avgDays = proposals.stream()
                .mapToLong(p -> {
                    Long days = movementRepository.findTotalDaysSpentForProposal(p);
                    return days != null ? days : 0L;
                })
                .average()
                .orElse(0.0);

        double avgExecutiveDays = 0.0;
        var execStageOpt = stageRepository.findByStageName("Executive Department");
        if (execStageOpt.isPresent()) {
            Double avg = movementRepository.findAverageDaysSpentAtStageAndDepartment(execStageOpt.get().getId(), dept);
            avgExecutiveDays = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
        }

        double avgAccountsDays = 0.0;
        var acctStageOpt = stageRepository.findByStageName("Accounts Department");
        if (acctStageOpt.isPresent()) {
            Double avg = movementRepository.findAverageDaysSpentAtStageAndDepartment(acctStageOpt.get().getId(), dept);
            avgAccountsDays = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
        }

        return DashboardStatsDTO.builder()
                .totalProposals(total)
                .pendingProposals(pending)
                .completedProposals(completed)
                .returnedProposals(returned)
                .approvedProposals(approved)
                .rejectedProposals(rejected)
                .underReviewProposals(underReview)
                .averageProcessingDays(Math.round(avgDays * 10.0) / 10.0)
                .avgExecutiveDepartmentDays(avgExecutiveDays)
                .avgAccountsDepartmentDays(avgAccountsDays)
                .build();
    }

    public List<StageDelayDTO> getStageDelayReport(String username) {
        Department dept = getDepartmentForUser(username);
        List<ProposalStage> stages = stageRepository.findAll();
        List<StageDelayDTO> result = new ArrayList<>();

        for (ProposalStage stage : stages) {
            Double avgDays = movementRepository.findAverageDaysSpentAtStageAndDepartment(stage.getId(), dept);
            long count = movementRepository.findAll().stream()
                    .filter(m -> m.getToStage().getId().equals(stage.getId()))
                    .filter(m -> dept == null || (m.getProposal().getDepartment() != null && m.getProposal().getDepartment().getId().equals(dept.getId())))
                    .count();

            StageDelayDTO dto = new StageDelayDTO(
                    stage.getId(),
                    stage.getStageName(),
                    stage.getSequenceNumber(),
                    avgDays != null ? Math.round(avgDays * 10.0) / 10.0 : 0.0,
                    count
            );
            result.add(dto);
        }

        result.sort((a, b) -> a.getSequenceNumber().compareTo(b.getSequenceNumber()));
        return result;
    }

    public List<DepartmentPerformanceDTO> getDepartmentPerformanceReport(String username) {
        Department dept = getDepartmentForUser(username);
        List<Department> departmentsToReport = dept != null ? Collections.singletonList(dept) : departmentRepository.findAll();
        
        return departmentsToReport.stream()
                .map(d -> {
                    List<Proposal> proposals = proposalRepository.findByDepartment(d);
                    long total = proposals.size();
                    long completedCount = proposals.stream()
                            .filter(p -> p.getStatus() == ProposalStatus.COMPLETED ||
                                         p.getStatus() == ProposalStatus.APPROVED)
                            .count();

                    double avgDays = proposals.stream()
                            .mapToLong(p -> {
                                Long days = movementRepository.findTotalDaysSpentForProposal(p);
                                return days != null ? days : 0L;
                            })
                            .average()
                            .orElse(0.0);

                    return new DepartmentPerformanceDTO(
                            d.getId(),
                            d.getName(),
                            total,
                            completedCount,
                            Math.round(avgDays * 10.0) / 10.0
                    );
                })
                .collect(java.util.stream.Collectors.toList());
    }

    public AgingReportDTO getAgingReport(String username, ProposalService proposalService) {
        Department dept = getDepartmentForUser(username);
        List<Proposal> over7 = movementRepository.findAgingProposalsWithDepartment(7, dept);
        List<Proposal> over15 = movementRepository.findAgingProposalsWithDepartment(15, dept);
        List<Proposal> over30 = movementRepository.findAgingProposalsWithDepartment(30, dept);

        return new AgingReportDTO(
                over7.stream().map(proposalService::toDTO).collect(java.util.stream.Collectors.toList()),
                over15.stream().map(proposalService::toDTO).collect(java.util.stream.Collectors.toList()),
                over30.stream().map(proposalService::toDTO).collect(java.util.stream.Collectors.toList())
        );
    }

    // ───────────────────────────────────────
    //  Phase 5: Officer Performance & Personal Stats
    // ───────────────────────────────────────
    public List<OfficerPerformanceDTO> getOfficerPerformance() {
        // Only non-admin users can appear as officers
        List<User> officers = userRepository.findAll().stream()
                .filter(u -> u.getRole() != UserRole.ADMIN)
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .collect(Collectors.toList());

        return officers.stream().map(u -> {
            OfficerPerformanceDTO dto = new OfficerPerformanceDTO();
            dto.setUserId(u.getId());
            dto.setFullName(u.getFullName());
            dto.setUsername(u.getUsername());
            dto.setDepartmentName(u.getDepartment() != null ? u.getDepartment().getName() : null);
            dto.setCurrentlyAssigned(proposalRepository.countActiveByAssignedTo(u));

            List<ProposalAuditLog> logs = auditLogRepository.findByActorOrderByTimestampDesc(u);
            dto.setTotalCreated((long) logs.stream().filter(l -> l.getAction() == ProposalAction.CREATE).count());
            dto.setTotalForwarded((long) logs.stream().filter(l -> l.getAction() == ProposalAction.FORWARD).count());
            dto.setTotalReturned((long) logs.stream().filter(l -> l.getAction() == ProposalAction.RETURN).count());
            dto.setTotalApproved((long) logs.stream().filter(l -> l.getAction() == ProposalAction.APPROVE).count());
            dto.setTotalCompleted((long) logs.stream().filter(l -> l.getAction() == ProposalAction.COMPLETE).count());
            dto.setTotalComments((long) logs.stream().filter(l -> l.getAction() == ProposalAction.COMMENT).count());

            // Average processing time for completed proposals
            List<Proposal> completedProposals = proposalRepository.findByAssignedTo(u).stream()
                    .filter(p -> p.getStatus() == ProposalStatus.COMPLETED || p.getStatus() == ProposalStatus.APPROVED)
                    .collect(Collectors.toList());
            double avg = completedProposals.stream()
                    .mapToLong(p -> {
                        Long days = movementRepository.findTotalDaysSpentForProposal(p);
                        return days != null ? days : 0L;
                    })
                    .average().orElse(0.0);
            dto.setAverageProcessingDays(Math.round(avg * 10.0) / 10.0);

            dto.setLastActivityAt(logs.isEmpty() ? null : logs.get(0).getTimestamp());
            return dto;
        }).collect(Collectors.toList());
    }

    public OfficerDashboardStatsDTO getMyStats(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        OfficerDashboardStatsDTO dto = new OfficerDashboardStatsDTO();
        dto.setAssignedToMe(proposalRepository.countActiveByAssignedTo(user));
        dto.setPendingReviews(proposalRepository.countByAssignedToAndStatus(user, ProposalStatus.PENDING));
        dto.setReturnedToMe(proposalRepository.countByAssignedToAndStatus(user, ProposalStatus.RETURNED));

        // Completed today
        long completedToday = proposalRepository.findByAssignedTo(user).stream()
                .filter(p -> (p.getStatus() == ProposalStatus.COMPLETED || p.getStatus() == ProposalStatus.APPROVED)
                        && p.getCompletionDate() != null
                        && p.getCompletionDate().isEqual(LocalDate.now()))
                .count();
        dto.setCompletedToday(completedToday);
        return dto;
    }
}
