package com.nwr.finance.controller;

import com.nwr.finance.entity.Proposal;
import com.nwr.finance.repository.ProposalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final ProposalRepository proposalRepository;

    @GetMapping("/proposals")
    public List<String> dumpProposals() {
        return proposalRepository.findAll().stream().map(p -> 
            String.format("ID: %d | Num: %s | Stage: %s | Status: %s | Dept: %s | AssignedTo: %s",
                p.getId(),
                p.getProposalNumber(),
                p.getCurrentStage() != null ? p.getCurrentStage().getStageName() : "NULL",
                p.getStatus(),
                p.getDepartment() != null ? p.getDepartment().getName() : "NULL",
                p.getAssignedTo() != null ? p.getAssignedTo().getUsername() : "NULL"
            )
        ).collect(Collectors.toList());
    }
}
