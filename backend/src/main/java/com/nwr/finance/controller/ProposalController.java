package com.nwr.finance.controller;

import com.nwr.finance.dto.*;
import com.nwr.finance.service.ProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/proposals")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;

    @GetMapping
    public ResponseEntity<List<ProposalDTO>> getAllProposals(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long stageId) {
        return ResponseEntity.ok(proposalService.getAllProposals(search, departmentId, status, stageId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProposalDTO> getProposalById(@PathVariable Long id) {
        return ResponseEntity.ok(proposalService.getProposalById(id));
    }

    @PostMapping
    public ResponseEntity<ProposalDTO> createProposal(@Valid @RequestBody CreateProposalRequest request) {
        ProposalDTO created = proposalService.createProposal(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/move")
    public ResponseEntity<ProposalDTO> moveProposal(
            @PathVariable Long id,
            @Valid @RequestBody MoveProposalRequest request) {
        return ResponseEntity.ok(proposalService.moveProposal(id, request));
    }

    @GetMapping("/{id}/movements")
    public ResponseEntity<List<ProposalMovementDTO>> getMovementHistory(@PathVariable Long id) {
        return ResponseEntity.ok(proposalService.getMovementHistory(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ProposalDTO> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(proposalService.updateStatus(id, status));
    }
}
