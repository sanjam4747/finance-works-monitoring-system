package com.nwr.finance.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "proposal_stages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalStage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stage_name", nullable = false, unique = true, length = 100)
    private String stageName;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;
}
