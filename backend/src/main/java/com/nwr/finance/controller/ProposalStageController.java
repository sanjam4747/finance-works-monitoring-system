package com.nwr.finance.controller;

import com.nwr.finance.dto.ProposalStageDTO;
import com.nwr.finance.service.ProposalStageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stages")

@RequiredArgsConstructor
public class ProposalStageController {

    private final ProposalStageService stageService;

    @GetMapping
    public ResponseEntity<List<ProposalStageDTO>> getAllStages() {
        return ResponseEntity.ok(stageService.getAllStages());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProposalStageDTO> getStageById(@PathVariable Long id) {
        return ResponseEntity.ok(stageService.getStageById(id));
    }
}
