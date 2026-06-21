package com.nwr.finance.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "proposals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Proposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "proposal_number", nullable = false, unique = true, length = 50)
    private String proposalNumber;

    @Column(name = "proposal_title", nullable = false, length = 255)
    private String proposalTitle;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "current_stage_id")
    private ProposalStage currentStage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProposalStatus status;

    @Column(name = "submission_date", nullable = false)
    private LocalDate submissionDate;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "remarks", length = 1000)
    private String remarks;
}
