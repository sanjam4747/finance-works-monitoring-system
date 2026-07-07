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

@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final ProposalMovementRepository movementRepository;
    private final ProposalService proposalService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @RequestHeader(value = "X-Username", required = false) String username) {
        return ResponseEntity.ok(dashboardService.getDashboardStats(username));
    }

    @GetMapping("/reports/stage-delay")
    public ResponseEntity<List<StageDelayDTO>> getStageDelayReport(
            @RequestHeader(value = "X-Username", required = false) String username) {
        return ResponseEntity.ok(dashboardService.getStageDelayReport(username));
    }

    @GetMapping("/reports/department-performance")
    public ResponseEntity<List<DepartmentPerformanceDTO>> getDepartmentPerformanceReport(
            @RequestHeader(value = "X-Username", required = false) String username) {
        return ResponseEntity.ok(dashboardService.getDepartmentPerformanceReport(username));
    }

    @GetMapping("/reports/aging")
    public ResponseEntity<AgingReportDTO> getAgingReport(
            @RequestHeader(value = "X-Username", required = false) String username) {
        AgingReportDTO report = dashboardService.getAgingReport(username, proposalService);
        return ResponseEntity.ok(report);
    }

    // Phase 5: Admin-only officer performance
    @GetMapping("/reports/officer-performance")
    public ResponseEntity<List<OfficerPerformanceDTO>> getOfficerPerformance(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(dashboardService.getOfficerPerformance());
    }

    // Phase 5: Personal officer dashboard stats
    @GetMapping("/dashboard/my-stats")
    public ResponseEntity<OfficerDashboardStatsDTO> getMyStats(
            @RequestHeader(value = "X-Username", required = false) String username) {
        return ResponseEntity.ok(dashboardService.getMyStats(username));
    }
}
