package com.nwr.finance.service;

import com.nwr.finance.dto.*;
import com.nwr.finance.entity.*;
import com.nwr.finance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final ProposalRepository proposalRepository;
    private final ProposalMovementRepository movementRepository;
    private final ProposalStageRepository stageRepository;
    private final DepartmentRepository departmentRepository;

    public DashboardStatsDTO getDashboardStats() {
        long total = proposalRepository.count();
        long pending = proposalRepository.countByStatus(ProposalStatus.PENDING);
        long completed = proposalRepository.countByStatus(ProposalStatus.COMPLETED);
        long returned = proposalRepository.countByStatus(ProposalStatus.RETURNED);
        long approved = proposalRepository.countByStatus(ProposalStatus.APPROVED);
        long rejected = proposalRepository.countByStatus(ProposalStatus.REJECTED);
        long underReview = proposalRepository.countByStatus(ProposalStatus.UNDER_REVIEW);

        // Calculate average processing days across all proposals that have completed movements
        double avgDays = proposalRepository.findAll().stream()
                .mapToLong(p -> {
                    Long days = movementRepository.findTotalDaysSpentForProposal(p);
                    return days != null ? days : 0L;
                })
                .average()
                .orElse(0.0);

        return DashboardStatsDTO.builder()
                .totalProposals(total)
                .pendingProposals(pending)
                .completedProposals(completed)
                .returnedProposals(returned)
                .approvedProposals(approved)
                .rejectedProposals(rejected)
                .underReviewProposals(underReview)
                .averageProcessingDays(Math.round(avgDays * 10.0) / 10.0)
                .build();
    }

    public List<StageDelayDTO> getStageDelayReport() {
        List<ProposalStage> stages = stageRepository.findAll();
        List<StageDelayDTO> result = new ArrayList<>();

        for (ProposalStage stage : stages) {
            Double avgDays = movementRepository.findAverageDaysSpentAtStage(stage.getId());
            long count = movementRepository.findAll().stream()
                    .filter(m -> m.getToStage().getId().equals(stage.getId()))
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

    public List<DepartmentPerformanceDTO> getDepartmentPerformanceReport() {
        return departmentRepository.findAll().stream()
                .map(dept -> {
                    List<Proposal> proposals = proposalRepository.findByDepartment(dept);
                    long total = proposals.size();
                    long completed = proposals.stream()
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
                            dept.getId(),
                            dept.getName(),
                            total,
                            completed,
                            Math.round(avgDays * 10.0) / 10.0
                    );
                })
                .collect(java.util.stream.Collectors.toList());
    }
}
