package com.nwr.finance.service;

import com.nwr.finance.dto.*;
import com.nwr.finance.entity.*;
import com.nwr.finance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public List<ProposalDTO> getAllProposals(String search, Long departmentId, String status, Long stageId) {
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
        Long stageParam = (stageId != null && stageId > 0) ? stageId : null;

        return proposalRepository.findWithFilters(searchParam, deptParam, statusEnum, stageParam)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProposalDTO getProposalById(Long id) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proposal not found with id: " + id));
        return toDTO(proposal);
    }

    public ProposalDTO createProposal(CreateProposalRequest request) {
        if (proposalRepository.existsByProposalNumber(request.getProposalNumber())) {
            throw new RuntimeException("Proposal number already exists: " + request.getProposalNumber());
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));

        ProposalStage initialStage = stageRepository.findById(request.getInitialStageId())
                .orElseThrow(() -> new RuntimeException("Stage not found"));

        Proposal proposal = new Proposal();
        proposal.setProposalNumber(request.getProposalNumber());
        proposal.setProposalTitle(request.getProposalTitle());
        proposal.setDepartment(department);
        proposal.setCurrentStage(initialStage);
        proposal.setStatus(ProposalStatus.PENDING);
        proposal.setSubmissionDate(LocalDate.now());
        proposal.setRemarks(request.getRemarks());

        Proposal saved = proposalRepository.save(proposal);

        // Create initial movement record
        ProposalMovement movement = new ProposalMovement();
        movement.setProposal(saved);
        movement.setFromStage(null);
        movement.setToStage(initialStage);
        movement.setEnteredAt(LocalDateTime.now());
        movement.setExitedAt(null);
        movement.setDaysSpent(null);
        movement.setRemarks("Initial submission");
        movementRepository.save(movement);

        return toDTO(saved);
    }

    public ProposalDTO moveProposal(Long proposalId, MoveProposalRequest request) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        ProposalStage toStage = stageRepository.findById(request.getToStageId())
                .orElseThrow(() -> new RuntimeException("Target stage not found"));

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

    public ProposalDTO updateStatus(Long proposalId, String newStatus) {
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
