package com.nwr.finance.service;

import com.nwr.finance.dto.*;
import com.nwr.finance.entity.*;
import com.nwr.finance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final DepartmentRepository departmentRepository;
    private final ProposalStageRepository stageRepository;
    private final ProposalMovementRepository movementRepository;
    private final DepartmentService departmentService;
    private final ProposalStageService stageService;

    // ──────────────────────────────────────────────
    //  Proposal Number Auto-Generation (Change 4)
    // ──────────────────────────────────────────────
    private String generateNextProposalNumber() {
        int year = LocalDate.now().getYear();
        String prefix = "FW-" + year + "-";

        int maxNum = proposalRepository.findAll().stream()
                .filter(p -> p.getProposalNumber() != null && p.getProposalNumber().startsWith(prefix))
                .mapToInt(p -> {
                    try {
                        String numStr = p.getProposalNumber().substring(prefix.length());
                        return Integer.parseInt(numStr);
                    } catch (Exception e) {
                        return 0;
                    }
                })
                .max()
                .orElse(0);

        return prefix + String.format("%03d", maxNum + 1);
    }

    // ──────────────────────────────────────────────
    //  Get All Proposals (with role-based filtering)
    // ──────────────────────────────────────────────
    public List<ProposalDTO> getAllProposals(String search, Long departmentId, String status,
                                             Long stageId, String userRole) {
        ProposalStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = ProposalStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                statusEnum = null;
            }
        }
        String searchParam = (search != null && !search.isBlank()) ? search : null;
        Long deptParam = (departmentId != null && departmentId > 0) ? departmentId : null;
        Long stageParam = stageId;

        // Role-based stage filtering (Change 3)
        if ("EXECUTIVE_USER".equals(userRole)) {
            Long execStageId = stageRepository.findByStageName("Executive Department")
                    .map(ProposalStage::getId).orElse(null);
            if (execStageId != null) stageParam = execStageId;
        } else if ("ACCOUNTS_USER".equals(userRole)) {
            Long acctStageId = stageRepository.findByStageName("Accounts Department")
                    .map(ProposalStage::getId).orElse(null);
            if (acctStageId != null) stageParam = acctStageId;
        }

        final Long finalStageParam = stageParam;
        return proposalRepository.findWithFilters(searchParam, deptParam, statusEnum, finalStageParam)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProposalDTO getProposalById(Long id) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proposal not found with id: " + id));
        return toDTO(proposal);
    }

    // ──────────────────────────────────────────────
    //  Create Proposal (auto number, auto stage)
    // ──────────────────────────────────────────────
    public ProposalDTO createProposal(CreateProposalRequest request) {
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));

        // Auto-set initial stage to Executive Department (Change 4)
        ProposalStage initialStage = stageRepository.findByStageName("Executive Department")
                .orElseThrow(() -> new RuntimeException("Executive Department stage not found. Please ensure data is initialized."));

        // Auto-generate proposal number (Change 4)
        String proposalNumber = generateNextProposalNumber();

        Proposal proposal = new Proposal();
        proposal.setProposalNumber(proposalNumber);
        proposal.setProposalTitle(request.getProposalTitle());
        proposal.setDepartment(department);
        proposal.setCurrentStage(initialStage);
        proposal.setStatus(ProposalStatus.PENDING);           // Auto status
        proposal.setSubmissionDate(LocalDate.now());           // Auto date
        proposal.setRemarks(request.getRemarks());

        // Product fields (Change 1)
        proposal.setProductName(request.getProductName());
        proposal.setProductQuantity(request.getProductQuantity());
        proposal.setOfferedPrice(request.getOfferedPrice());
        proposal.setMarketPrice(request.getMarketPrice());

        Proposal saved = proposalRepository.save(proposal);

        // Create initial movement record
        ProposalMovement movement = new ProposalMovement();
        movement.setProposal(saved);
        movement.setFromStage(null);
        movement.setToStage(initialStage);
        movement.setEnteredAt(LocalDateTime.now());
        movement.setExitedAt(null);
        movement.setDaysSpent(null);
        movement.setRemarks("Initial submission to Executive Department");
        movementRepository.save(movement);

        return toDTO(saved);
    }

    // ──────────────────────────────────────────────
    //  Move Proposal (with role validation)
    // ──────────────────────────────────────────────
    public ProposalDTO moveProposal(Long proposalId, MoveProposalRequest request, String userRole) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        ProposalStage toStage = stageRepository.findById(request.getToStageId())
                .orElseThrow(() -> new RuntimeException("Target stage not found"));

        // Role-based move restriction (Change 3)
        if ("EXECUTIVE_USER".equals(userRole)) {
            if (!"Accounts Department".equals(toStage.getStageName())) {
                throw new RuntimeException("Executive users can only move proposals to Accounts Department");
            }
        }
        // ACCOUNTS_USER should not use moveProposal (they update status instead)
        if ("ACCOUNTS_USER".equals(userRole)) {
            throw new RuntimeException("Accounts users should use status update actions instead of moving proposals");
        }

        // Close current open movement
        ProposalMovement currentMovement = movementRepository.findCurrentMovement(proposal)
                .orElse(null);

        LocalDateTime now = LocalDateTime.now();

        if (currentMovement != null) {
            currentMovement.setExitedAt(now);
            long days = ChronoUnit.DAYS.between(currentMovement.getEnteredAt(), now);
            currentMovement.setDaysSpent(days);
            movementRepository.save(currentMovement);
        }

        // Create new movement record
        ProposalMovement newMovement = new ProposalMovement();
        newMovement.setProposal(proposal);
        newMovement.setFromStage(proposal.getCurrentStage());
        newMovement.setToStage(toStage);
        newMovement.setEnteredAt(now);
        newMovement.setExitedAt(null);
        newMovement.setDaysSpent(null);
        newMovement.setRemarks(request.getRemarks());
        movementRepository.save(newMovement);

        // Update proposal current stage and status
        proposal.setCurrentStage(toStage);
        proposal.setStatus(ProposalStatus.UNDER_REVIEW);
        proposalRepository.save(proposal);

        return toDTO(proposal);
    }

    public List<ProposalMovementDTO> getMovementHistory(Long proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        return movementRepository.findByProposalOrderByEnteredAtAsc(proposal)
                .stream()
                .map(m -> toMovementDTO(m, proposal.getCurrentStage()))
                .collect(Collectors.toList());
    }

    public ProposalDTO updateStatus(Long proposalId, String newStatus, String userRole) {
        // Role-based restriction: only ADMIN or ACCOUNTS_USER can update status (Change 3)
        if (userRole != null && "EXECUTIVE_USER".equals(userRole)) {
            throw new RuntimeException("Executive users cannot update proposal status directly");
        }

        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        ProposalStatus status = ProposalStatus.valueOf(newStatus.toUpperCase());
        proposal.setStatus(status);

        if (status == ProposalStatus.COMPLETED || status == ProposalStatus.APPROVED || status == ProposalStatus.REJECTED) {
            proposal.setCompletionDate(LocalDate.now());

            // Close any open movement
            movementRepository.findCurrentMovement(proposal).ifPresent(m -> {
                LocalDateTime now = LocalDateTime.now();
                m.setExitedAt(now);
                long days = ChronoUnit.DAYS.between(m.getEnteredAt(), now);
                m.setDaysSpent(days);
                movementRepository.save(m);
            });
        }

        return toDTO(proposalRepository.save(proposal));
    }

    // ──────────────────────────────────────────────
    //  DTO Mapping
    // ──────────────────────────────────────────────
    public ProposalDTO toDTO(Proposal proposal) {
        ProposalDTO dto = new ProposalDTO();
        dto.setId(proposal.getId());
        dto.setProposalNumber(proposal.getProposalNumber());
        dto.setProposalTitle(proposal.getProposalTitle());
        dto.setDepartment(departmentService.toDTO(proposal.getDepartment()));
        dto.setCurrentStage(proposal.getCurrentStage() != null ? stageService.toDTO(proposal.getCurrentStage()) : null);
        dto.setStatus(proposal.getStatus());
        dto.setSubmissionDate(proposal.getSubmissionDate());
        dto.setCompletionDate(proposal.getCompletionDate());
        dto.setRemarks(proposal.getRemarks());

        Long totalDays = movementRepository.findTotalDaysSpentForProposal(proposal);
        dto.setTotalDaysSpent(totalDays != null ? totalDays : 0L);

        // Product fields (Change 1)
        dto.setProductName(proposal.getProductName());
        dto.setProductQuantity(proposal.getProductQuantity());
        dto.setOfferedPrice(proposal.getOfferedPrice());
        dto.setMarketPrice(proposal.getMarketPrice());

        // Computed price difference
        if (proposal.getMarketPrice() != null && proposal.getOfferedPrice() != null) {
            dto.setPriceDifference(proposal.getMarketPrice().subtract(proposal.getOfferedPrice()));
        } else {
            dto.setPriceDifference(null);
        }

        return dto;
    }

    private ProposalMovementDTO toMovementDTO(ProposalMovement movement, ProposalStage currentStage) {
        ProposalMovementDTO dto = new ProposalMovementDTO();
        dto.setId(movement.getId());
        dto.setProposalId(movement.getProposal().getId());
        dto.setFromStage(movement.getFromStage() != null ? stageService.toDTO(movement.getFromStage()) : null);
        dto.setToStage(stageService.toDTO(movement.getToStage()));
        dto.setEnteredAt(movement.getEnteredAt());
        dto.setExitedAt(movement.getExitedAt());
        dto.setDaysSpent(movement.getDaysSpent());
        dto.setRemarks(movement.getRemarks());
        dto.setCurrent(movement.getExitedAt() == null);
        return dto;
    }
}
