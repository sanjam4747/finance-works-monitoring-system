package com.nwr.finance.service;

import com.nwr.finance.dto.NotificationDTO;
import com.nwr.finance.entity.*;
import com.nwr.finance.repository.NotificationRepository;
import com.nwr.finance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void generateNotifications(Proposal proposal, User actor, ProposalAction action, String remarks) {
        if (proposal == null || proposal.getDepartment() == null) return;
        Long deptId = proposal.getDepartment().getId();
        
        List<User> recipients;
        NotificationType type;
        String title;
        String message;
        
        switch (action) {
            case FORWARD:
                // Phase 5: Notify the assigned Accounts officer (targeted), fallback to all Accounts users
                if (proposal.getAssignedTo() != null && proposal.getAssignedTo().getRole() == UserRole.ACCOUNTS_USER) {
                    recipients = new java.util.ArrayList<>(List.of(proposal.getAssignedTo()));
                } else {
                    recipients = userRepository.findByDepartment_IdAndRoleAndIsActiveTrue(deptId, UserRole.ACCOUNTS_USER);
                }
                type = NotificationType.PROPOSAL_FORWARDED;
                title = "Proposal Forwarded";
                message = "Proposal " + proposal.getProposalNumber() + " has been forwarded to Accounts.";
                break;
            case RETURN:
                // Phase 5: Notify the assigned Executive officer (targeted), fallback to all Executive users
                if (proposal.getAssignedTo() != null && proposal.getAssignedTo().getRole() == UserRole.EXECUTIVE_USER) {
                    recipients = new java.util.ArrayList<>(List.of(proposal.getAssignedTo()));
                } else {
                    recipients = userRepository.findByDepartment_IdAndRoleAndIsActiveTrue(deptId, UserRole.EXECUTIVE_USER);
                }
                type = NotificationType.PROPOSAL_RETURNED;
                title = "Proposal Returned";
                message = "Proposal " + proposal.getProposalNumber() + " was returned by Accounts.";
                break;
            case APPROVE:
                // Phase 5: Notify assigned officer + creator if different
                recipients = buildTerminalRecipients(proposal, deptId, UserRole.EXECUTIVE_USER);
                type = NotificationType.PROPOSAL_APPROVED;
                title = "Proposal Approved";
                message = "Proposal " + proposal.getProposalNumber() + " has been approved.";
                break;
            case REJECT:
                recipients = buildTerminalRecipients(proposal, deptId, UserRole.EXECUTIVE_USER);
                type = NotificationType.PROPOSAL_REJECTED;
                title = "Proposal Rejected";
                message = "Proposal " + proposal.getProposalNumber() + " has been rejected.";
                break;
            case COMPLETE:
                recipients = buildTerminalRecipients(proposal, deptId, UserRole.EXECUTIVE_USER);
                type = NotificationType.PROPOSAL_COMPLETED;
                title = "Proposal Completed";
                message = "Proposal " + proposal.getProposalNumber() + " processing is complete.";
                break;
            case COMMENT:
                // Phase 5: Notify assignedTo + createdBy (deduplicated), excluding actor
                recipients = buildCommentRecipients(proposal, deptId);
                type = NotificationType.NEW_COMMENT;
                title = "New Comment";
                message = (actor != null ? actor.getFullName() : "Someone") + " commented on proposal " + proposal.getProposalNumber() + ".";
                break;
            case CREATE:
            case UPDATE:
            case ASSIGNED:
            default:
                return; // Do not generate notifications for these actions
        }

        // Remove the actor from recipients (don't notify the person who took the action)
        if (actor != null) {
            recipients.removeIf(u -> u.getId().equals(actor.getId()));
        }

        for (User recipient : recipients) {
            Notification notification = new Notification();
            notification.setRecipient(recipient);
            notification.setProposal(proposal);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setType(type);
            notification.setTimestamp(LocalDateTime.now());
            notification.setRead(false);
            notificationRepository.save(notification);
        }
    }

    // Phase 5: Notify assigned officer; also notify creator if different
    private List<User> buildTerminalRecipients(Proposal proposal, Long deptId, UserRole fallbackRole) {
        java.util.Set<Long> seen = new java.util.HashSet<>();
        List<User> result = new java.util.ArrayList<>();
        
        if (proposal.getAssignedTo() != null && Boolean.TRUE.equals(proposal.getAssignedTo().getIsActive())) {
            result.add(proposal.getAssignedTo());
            seen.add(proposal.getAssignedTo().getId());
        }
        if (proposal.getCreatedBy() != null && Boolean.TRUE.equals(proposal.getCreatedBy().getIsActive())
                && !seen.contains(proposal.getCreatedBy().getId())) {
            result.add(proposal.getCreatedBy());
            seen.add(proposal.getCreatedBy().getId());
        }
        // Fallback if nobody resolved
        if (result.isEmpty()) {
            result = userRepository.findByDepartment_IdAndRoleAndIsActiveTrue(deptId, fallbackRole);
        }
        return result;
    }

    // Phase 5: For comments, notify assignedTo + createdBy
    private List<User> buildCommentRecipients(Proposal proposal, Long deptId) {
        java.util.Set<Long> seen = new java.util.HashSet<>();
        List<User> result = new java.util.ArrayList<>();
        
        if (proposal.getAssignedTo() != null && Boolean.TRUE.equals(proposal.getAssignedTo().getIsActive())) {
            result.add(proposal.getAssignedTo());
            seen.add(proposal.getAssignedTo().getId());
        }
        if (proposal.getCreatedBy() != null && Boolean.TRUE.equals(proposal.getCreatedBy().getIsActive())
                && !seen.contains(proposal.getCreatedBy().getId())) {
            result.add(proposal.getCreatedBy());
            seen.add(proposal.getCreatedBy().getId());
        }
        // Fallback
        if (result.isEmpty()) {
            result = userRepository.findByDepartment_IdAndIsActiveTrue(deptId);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUserNotifications(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
                
        return notificationRepository.findByRecipientOrderByTimestampDesc(user)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void markAsRead(Long notificationId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
                
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
                
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied");
        }
        
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
                
        notificationRepository.markAllAsReadByRecipient(user);
    }

    private NotificationDTO toDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        if (notification.getProposal() != null) {
            dto.setProposalId(notification.getProposal().getId());
            dto.setProposalNumber(notification.getProposal().getProposalNumber());
            if (notification.getProposal().getDepartment() != null) {
                dto.setDepartmentName(notification.getProposal().getDepartment().getName());
            }
        }
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType().name());
        dto.setRead(notification.isRead());
        dto.setTimestamp(notification.getTimestamp());
        return dto;
    }
}
