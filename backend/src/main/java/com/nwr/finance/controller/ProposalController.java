package com.nwr.finance.controller;

import com.nwr.finance.dto.*;
import com.nwr.finance.service.ProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/proposals")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;

    @GetMapping
    public ResponseEntity<List<ProposalDTO>> getAllProposals(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Username",  required = false) String username,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long stageId) {
        return ResponseEntity.ok(
                proposalService.getAllProposals(search, departmentId, status, stageId, userRole, username)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProposalDTO> getProposalById(
            @PathVariable Long id,
            @RequestHeader(value = "X-Username", required = false) String username) {
        return ResponseEntity.ok(proposalService.getProposalById(id, username));
    }

    @PostMapping
    public ResponseEntity<?> createProposal(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Username",  required = false) String username,
            @Valid @RequestBody CreateProposalRequest request) {

        if (userRole != null && "ACCOUNTS_USER".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Accounts users cannot create proposals"));
        }

        ProposalDTO created = proposalService.createProposal(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/move")
    public ResponseEntity<?> moveProposal(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Username",  required = false) String username,
            @Valid @RequestBody MoveProposalRequest request) {

        if ("ACCOUNTS_USER".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Accounts users should use status update actions"));
        }

        try {
            return ResponseEntity.ok(proposalService.moveProposal(id, request, userRole, username));
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason() != null ? ex.getReason() : ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/{id}/movements")
    public ResponseEntity<List<ProposalMovementDTO>> getMovementHistory(@PathVariable Long id) {
        return ResponseEntity.ok(proposalService.getMovementHistory(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Username",  required = false) String username,
            @RequestBody Map<String, String> body) {

        if ("EXECUTIVE_USER".equals(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Executive users cannot update proposal status"));
        }

        try {
            String status = body.get("status");
            String remarks = body.get("remarks");
            return ResponseEntity.ok(proposalService.updateStatus(id, status, remarks, userRole, username));
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason() != null ? ex.getReason() : ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ProposalCommentDTO> addComment(
            @PathVariable Long id,
            @RequestHeader(value = "X-Username", required = false) String username,
            @Valid @RequestBody AddCommentRequest request) {
        ProposalCommentDTO comment = proposalService.addComment(id, request.getText(), username);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<ProposalCommentDTO>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(proposalService.getComments(id));
    }

    @GetMapping("/{id}/audit-logs")
    public ResponseEntity<List<ProposalAuditLogDTO>> getAuditLogs(@PathVariable Long id) {
        return ResponseEntity.ok(proposalService.getAuditLogs(id));
    }
}
