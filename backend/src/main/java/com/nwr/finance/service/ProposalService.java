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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProposalService {

    private final ProposalRepository          proposalRepository;
    private final DepartmentRepository        departmentRepository;
    private final ProposalStageRepository     stageRepository;
    private final ProposalMovementRepository  movementRepository;
    private final ProposalItemRepository      itemRepository;
    private final ProposalSequenceRepository  sequenceRepository;
    private final UserRepository              userRepository;
    private final DepartmentService           departmentService;
    private final ProposalStageService        stageService;

    // ──────────────────────────────────────────────
    //  Atomic Proposal Number Generation (Phase 1)
    //  Uses pessimistic write lock on proposal_sequences
    //  to guarantee uniqueness under concurrent load.
    // ──────────────────────────────────────────────
    private String generateNextProposalNumber() {
        int year = LocalDate.now().getYear();

        ProposalSequence seq = sequenceRepository.findByYearForUpdate(year)
                .orElseGet(() -> {
                    ProposalSequence newSeq = new ProposalSequence(year, 0);
                    return sequenceRepository.save(newSeq);
                });

        seq.setLastSeq(seq.getLastSeq() + 1);
        sequenceRepository.save(seq);

        return "FW-" + year + "-" + String.format("%03d", seq.getLastSeq());
    }

    // ──────────────────────────────────────────────
    //  Get All Proposals (with role-based filtering)
    // ──────────────────────────────────────────────
    @Transactional(readOnly = true)
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
        Long deptParam  = (departmentId != null && departmentId > 0) ? departmentId : null;
        Long stageParam = stageId;

        // Role-based stage filtering
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

    @Transactional(readOnly = true)
    public ProposalDTO getProposalById(Long id) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proposal not found with id: " + id));
        return toDTO(proposal);
    }

    // ──────────────────────────────────────────────
    //  Create Proposal (Phase 1: items + createdBy)
    // ──────────────────────────────────────────────
    public ProposalDTO createProposal(CreateProposalRequest request, String username) {
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));

        ProposalStage initialStage = stageRepository.findByStageName("Executive Department")
                .orElseThrow(() -> new RuntimeException("Executive Department stage not found. Please ensure data is initialized."));

        String proposalNumber = generateNextProposalNumber();

        // Resolve the acting user if provided
        User creator = null;
        if (username != null && !username.isBlank()) {
            creator = userRepository.findByUsername(username).orElse(null);
        }

        Proposal proposal = new Proposal();
        proposal.setProposalNumber(proposalNumber);
        proposal.setProposalTitle(request.getProposalTitle());
        proposal.setDepartment(department);
        proposal.setCurrentStage(initialStage);
        proposal.setStatus(ProposalStatus.PENDING);
        proposal.setSubmissionDate(LocalDate.now());
        proposal.setRemarks(request.getRemarks());
        proposal.setCreatedBy(creator);

        Proposal saved = proposalRepository.save(proposal);

        // Save items (Phase 1)
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            List<ProposalItem> items = new ArrayList<>();
            for (int i = 0; i < request.getItems().size(); i++) {
                ProposalItemRequest ir = request.getItems().get(i);
                if (ir.getItemName() == null || ir.getItemName().isBlank()) continue;
                ProposalItem item = new ProposalItem();
                item.setProposal(saved);
                item.setItemName(ir.getItemName().trim());
                item.setQuantity(ir.getQuantity() != null ? ir.getQuantity() : 1);
                item.setUnit(ir.getUnit());
                item.setOfferedPrice(ir.getOfferedPrice());
                item.setMarketPrice(ir.getMarketPrice());
                item.setItemRemarks(ir.getItemRemarks());
                item.setSortOrder(i);
                items.add(item);
            }
            itemRepository.saveAll(items);
        }

        // Initial movement record
        ProposalMovement movement = new ProposalMovement();
        movement.setProposal(saved);
        movement.setFromStage(null);
        movement.setToStage(initialStage);
        movement.setEnteredAt(LocalDateTime.now());
        movement.setExitedAt(null);
        movement.setDaysSpent(null);
        movement.setRemarks("Initial submission to Executive Department");
        movement.setMovedBy(creator);
        movementRepository.save(movement);

        return toDTO(saved);
    }

    // ──────────────────────────────────────────────
    //  Move Proposal (Phase 1: movedBy tracking)
    // ──────────────────────────────────────────────
    public ProposalDTO moveProposal(Long proposalId, MoveProposalRequest request,
                                    String userRole, String username) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        ProposalStage toStage = stageRepository.findById(request.getToStageId())
                .orElseThrow(() -> new RuntimeException("Target stage not found"));

        // Role-based move restriction
        if ("EXECUTIVE_USER".equals(userRole)) {
            if (!"Accounts Department".equals(toStage.getStageName())) {
                throw new RuntimeException("Executive users can only move proposals to Accounts Department");
            }
        }
        if ("ACCOUNTS_USER".equals(userRole)) {
            throw new RuntimeException("Accounts users should use status update actions instead of moving proposals");
        }

        // Resolve actor
        User actor = null;
        if (username != null && !username.isBlank()) {
            actor = userRepository.findByUsername(username).orElse(null);
        }

        LocalDateTime now = LocalDateTime.now();

        // Close current open movement
        ProposalMovement currentMovement = movementRepository.findCurrentMovement(proposal).orElse(null);
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
        newMovement.setMovedBy(actor);
        movementRepository.save(newMovement);

        proposal.setCurrentStage(toStage);
        proposal.setStatus(ProposalStatus.UNDER_REVIEW);
        proposalRepository.save(proposal);

        return toDTO(proposal);
    }

    @Transactional(readOnly = true)
    public List<ProposalMovementDTO> getMovementHistory(Long proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        return movementRepository.findByProposalOrderByEnteredAtAsc(proposal)
                .stream()
                .map(m -> toMovementDTO(m, proposal.getCurrentStage()))
                .collect(Collectors.toList());
    }

    public ProposalDTO updateStatus(Long proposalId, String newStatus,
                                    String userRole, String username) {
        if (userRole != null && "EXECUTIVE_USER".equals(userRole)) {
            throw new RuntimeException("Executive users cannot update proposal status directly");
        }

        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        ProposalStatus status = ProposalStatus.valueOf(newStatus.toUpperCase());
        proposal.setStatus(status);

        if (status == ProposalStatus.COMPLETED || status == ProposalStatus.APPROVED || status == ProposalStatus.REJECTED) {
            proposal.setCompletionDate(LocalDate.now());

            User actor = null;
            if (username != null && !username.isBlank()) {
                actor = userRepository.findByUsername(username).orElse(null);
            }

            final User finalActor = actor;
            movementRepository.findCurrentMovement(proposal).ifPresent(m -> {
                LocalDateTime now = LocalDateTime.now();
                m.setExitedAt(now);
                long days = ChronoUnit.DAYS.between(m.getEnteredAt(), now);
                m.setDaysSpent(days);
                if (m.getMovedBy() == null && finalActor != null) {
                    m.setMovedBy(finalActor);
                }
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
        dto.setCurrentStage(proposal.getCurrentStage() != null
                ? stageService.toDTO(proposal.getCurrentStage()) : null);
        dto.setStatus(proposal.getStatus());
        dto.setSubmissionDate(proposal.getSubmissionDate());
        dto.setCompletionDate(proposal.getCompletionDate());
        dto.setRemarks(proposal.getRemarks());

        Long totalDays = movementRepository.findTotalDaysSpentForProposal(proposal);
        dto.setTotalDaysSpent(totalDays != null ? totalDays : 0L);

        // Creator info (Phase 1)
        if (proposal.getCreatedBy() != null) {
            dto.setCreatedByUsername(proposal.getCreatedBy().getUsername());
            dto.setCreatedByFullName(proposal.getCreatedBy().getFullName());
        }

        // Items (Phase 1) — loaded fresh from repo to avoid LazyInitializationException
        List<ProposalItem> items = itemRepository.findByProposalOrderBySortOrderAsc(proposal);
        if (items != null && !items.isEmpty()) {
            List<ProposalItemDTO> itemDTOs = items.stream().map(this::toItemDTO).collect(Collectors.toList());
            dto.setItems(itemDTOs);
            dto.setTotalItemCount((long) itemDTOs.size());

            BigDecimal totalOffered = items.stream()
                    .filter(i -> i.getOfferedPrice() != null)
                    .map(i -> i.getOfferedPrice().multiply(BigDecimal.valueOf(i.getQuantity() != null ? i.getQuantity() : 1)))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalMarket = items.stream()
                    .filter(i -> i.getMarketPrice() != null)
                    .map(i -> i.getMarketPrice().multiply(BigDecimal.valueOf(i.getQuantity() != null ? i.getQuantity() : 1)))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            dto.setTotalOfferedPrice(totalOffered.compareTo(BigDecimal.ZERO) > 0 ? totalOffered : null);
            dto.setTotalMarketPrice(totalMarket.compareTo(BigDecimal.ZERO) > 0 ? totalMarket : null);

            if (dto.getTotalOfferedPrice() != null && dto.getTotalMarketPrice() != null) {
                dto.setTotalPriceDifference(dto.getTotalMarketPrice().subtract(dto.getTotalOfferedPrice()));
            }
        } else {
            dto.setItems(List.of());
            dto.setTotalItemCount(0L);
        }

        return dto;
    }

    private ProposalItemDTO toItemDTO(ProposalItem item) {
        ProposalItemDTO dto = new ProposalItemDTO();
        dto.setId(item.getId());
        dto.setItemName(item.getItemName());
        dto.setQuantity(item.getQuantity());
        dto.setUnit(item.getUnit());
        dto.setOfferedPrice(item.getOfferedPrice());
        dto.setMarketPrice(item.getMarketPrice());
        dto.setItemRemarks(item.getItemRemarks());
        dto.setSortOrder(item.getSortOrder());

        if (item.getMarketPrice() != null && item.getOfferedPrice() != null) {
            dto.setPriceDifference(item.getMarketPrice().subtract(item.getOfferedPrice()));
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

        // Phase 1: Actor info
        if (movement.getMovedBy() != null) {
            dto.setMovedByUsername(movement.getMovedBy().getUsername());
            dto.setMovedByFullName(movement.getMovedBy().getFullName());
        }
        return dto;
    }
}
