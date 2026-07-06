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
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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
    private final ProposalAuditLogRepository  auditLogRepository;
    private final ProposalCommentRepository   commentRepository;
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
                                             Long stageId, String userRole, String username) {
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

        // Force department filter for non-admins
        if (username != null && !username.isBlank()) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && user.getRole() != UserRole.ADMIN) {
                if (user.getDepartment() != null) {
                    deptParam = user.getDepartment().getId();
                } else {
                    // Non-admin without a department should not see any proposals from departments
                    deptParam = -1L;
                }
            }
        }

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
    public ProposalDTO getProposalById(Long id, String username) {
        Proposal proposal = proposalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found with id: " + id));
        
        if (username != null && !username.isBlank()) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && user.getRole() != UserRole.ADMIN) {
                if (proposal.getDepartment() == null || user.getDepartment() == null || 
                    !proposal.getDepartment().getId().equals(user.getDepartment().getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied: You do not have permission to view proposals from this department");
                }
            }
        }
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
        
        logAuditAction(saved, creator, ProposalAction.CREATE, "Proposal created");

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found"));

        if (username != null && !username.isBlank()) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && user.getRole() != UserRole.ADMIN) {
                if (proposal.getDepartment() == null || user.getDepartment() == null || 
                    !proposal.getDepartment().getId().equals(user.getDepartment().getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied: You do not have permission to move proposals from this department");
                }
            }
        }

        ProposalStage toStage = stageRepository.findById(request.getToStageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target stage not found"));

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

        logAuditAction(proposal, actor, ProposalAction.FORWARD, request.getRemarks());

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

    public ProposalDTO updateStatus(Long proposalId, String newStatus, String remarks,
                                    String userRole, String username) {
        if (userRole != null && "EXECUTIVE_USER".equals(userRole)) {
            throw new RuntimeException("Executive users cannot update proposal status directly");
        }

        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found"));

        if (username != null && !username.isBlank()) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && user.getRole() != UserRole.ADMIN) {
                if (proposal.getDepartment() == null || user.getDepartment() == null || 
                    !proposal.getDepartment().getId().equals(user.getDepartment().getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied: You do not have permission to update proposals from this department");
                }
            }
        }

        ProposalStatus status = ProposalStatus.valueOf(newStatus.toUpperCase());
        
        if (status == ProposalStatus.RETURNED && (remarks == null || remarks.trim().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Remarks are mandatory when returning a proposal");
        }

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
        
        User actor = null;
        if (username != null && !username.isBlank()) {
            actor = userRepository.findByUsername(username).orElse(null);
        }

        ProposalAction action;
        if (status == ProposalStatus.RETURNED) action = ProposalAction.RETURN;
        else if (status == ProposalStatus.APPROVED) action = ProposalAction.APPROVE;
        else if (status == ProposalStatus.REJECTED) action = ProposalAction.REJECT;
        else if (status == ProposalStatus.COMPLETED) action = ProposalAction.COMPLETE;
        else action = ProposalAction.UPDATE;

        logAuditAction(proposal, actor, action, remarks);

        return toDTO(proposalRepository.save(proposal));
    }

    // ──────────────────────────────────────────────
    //  Comments & Audit Trail (Phase 3)
    // ──────────────────────────────────────────────
    public ProposalCommentDTO addComment(Long proposalId, String text, String username) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found"));
                
        User user = null;
        if (username != null && !username.isBlank()) {
            user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
            
            if (user.getRole() != UserRole.ADMIN) {
                if (proposal.getDepartment() == null || user.getDepartment() == null || 
                    !proposal.getDepartment().getId().equals(user.getDepartment().getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied: You do not have permission to comment on proposals from this department");
                }
            }
        } else {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized to comment");
        }
        
        ProposalComment comment = new ProposalComment();
        comment.setProposal(proposal);
        comment.setUser(user);
        comment.setDepartment(user.getDepartment());
        comment.setTimestamp(LocalDateTime.now());
        comment.setCommentText(text);
        
        ProposalComment saved = commentRepository.save(comment);
        logAuditAction(proposal, user, ProposalAction.COMMENT, "Added a comment");
        
        return toCommentDTO(saved);
    }
    
    @Transactional(readOnly = true)
    public List<ProposalCommentDTO> getComments(Long proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found"));
        return commentRepository.findByProposalOrderByTimestampDesc(proposal)
                .stream().map(this::toCommentDTO).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProposalAuditLogDTO> getAuditLogs(Long proposalId) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proposal not found"));
        return auditLogRepository.findByProposalOrderByTimestampDesc(proposal)
                .stream().map(this::toAuditLogDTO).collect(Collectors.toList());
    }
    
    private void logAuditAction(Proposal proposal, User actor, ProposalAction action, String remarks) {
        ProposalAuditLog log = new ProposalAuditLog();
        log.setProposal(proposal);
        log.setActor(actor);
        log.setDepartment(actor != null ? actor.getDepartment() : null);
        log.setTimestamp(LocalDateTime.now());
        log.setAction(action);
        log.setRemarks(remarks);
        auditLogRepository.save(log);
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
    
    private ProposalCommentDTO toCommentDTO(ProposalComment comment) {
        ProposalCommentDTO dto = new ProposalCommentDTO();
        dto.setId(comment.getId());
        dto.setProposalId(comment.getProposal().getId());
        dto.setCommentText(comment.getCommentText());
        dto.setTimestamp(comment.getTimestamp());
        if (comment.getUser() != null) {
            dto.setUsername(comment.getUser().getUsername());
            dto.setFullName(comment.getUser().getFullName());
        }
        if (comment.getDepartment() != null) {
            dto.setDepartmentName(comment.getDepartment().getName());
        }
        return dto;
    }
    
    private ProposalAuditLogDTO toAuditLogDTO(ProposalAuditLog log) {
        ProposalAuditLogDTO dto = new ProposalAuditLogDTO();
        dto.setId(log.getId());
        dto.setProposalId(log.getProposal().getId());
        dto.setAction(log.getAction().name());
        dto.setRemarks(log.getRemarks());
        dto.setTimestamp(log.getTimestamp());
        if (log.getActor() != null) {
            dto.setActorUsername(log.getActor().getUsername());
            dto.setActorFullName(log.getActor().getFullName());
        }
        if (log.getDepartment() != null) {
            dto.setDepartmentName(log.getDepartment().getName());
        }
        return dto;
    }
}
