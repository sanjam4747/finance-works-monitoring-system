package com.nwr.finance.controller;

import com.nwr.finance.repository.ProposalStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/debug2")
@RequiredArgsConstructor
public class Debug2Controller {
    private final ProposalStageRepository stageRepository;

    @GetMapping("/stage")
    public String getStage() {
        return stageRepository.findByStageName("Executive Department")
                .map(s -> "ID: " + s.getId() + ", Name: " + s.getStageName())
                .orElse("Not Found");
    }
}
