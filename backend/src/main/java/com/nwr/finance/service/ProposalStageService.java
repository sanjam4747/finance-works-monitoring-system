package com.nwr.finance.service;

import com.nwr.finance.dto.ProposalStageDTO;
import com.nwr.finance.entity.ProposalStage;
import com.nwr.finance.repository.ProposalStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProposalStageService {

    private final ProposalStageRepository stageRepository;

    public List<ProposalStageDTO> getAllStages() {
        return stageRepository.findAll().stream()
                .sorted((a, b) -> a.getSequenceNumber().compareTo(b.getSequenceNumber()))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProposalStageDTO getStageById(Long id) {
        ProposalStage stage = stageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stage not found with id: " + id));
        return toDTO(stage);
    }

    public ProposalStageDTO toDTO(ProposalStage stage) {
        return new ProposalStageDTO(stage.getId(), stage.getStageName(), stage.getSequenceNumber());
    }
}
