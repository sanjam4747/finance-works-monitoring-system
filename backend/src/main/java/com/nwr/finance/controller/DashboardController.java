package com.nwr.finance.controller;

import com.nwr.finance.dto.*;
import com.nwr.finance.entity.Proposal;
import com.nwr.finance.repository.ProposalMovementRepository;
import com.nwr.finance.service.DashboardService;
import com.nwr.finance.service.ProposalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final ProposalMovementRepository movementRepository;
    private final ProposalService proposalService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    @GetMapping("/reports/stage-delay")
    public ResponseEntity<List<StageDelayDTO>> getStageDelayReport() {
        return ResponseEntity.ok(dashboardService.getStageDelayReport());
    }

    @GetMapping("/reports/department-performance")
    public ResponseEntity<List<DepartmentPerformanceDTO>> getDepartmentPerformanceReport() {
        return ResponseEntity.ok(dashboardService.getDepartmentPerformanceReport());
    }

    @GetMapping("/reports/aging")
    public ResponseEntity<AgingReportDTO> getAgingReport() {
        List<Proposal> over7 = movementRepository.findAgingProposals(7);
        List<Proposal> over15 = movementRepository.findAgingProposals(15);
        List<Proposal> over30 = movementRepository.findAgingProposals(30);

        AgingReportDTO report = new AgingReportDTO(
                over7.stream().map(proposalService::toDTO).collect(java.util.stream.Collectors.toList()),
                over15.stream().map(proposalService::toDTO).collect(java.util.stream.Collectors.toList()),
                over30.stream().map(proposalService::toDTO).collect(java.util.stream.Collectors.toList())
        );
        return ResponseEntity.ok(report);
    }
}
