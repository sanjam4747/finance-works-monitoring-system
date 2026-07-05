package com.nwr.finance.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "proposal_movements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "proposal_id", nullable = false)
    private Proposal proposal;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "from_stage_id")
    private ProposalStage fromStage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "to_stage_id", nullable = false)
    private ProposalStage toStage;

    @Column(name = "entered_at", nullable = false)
    private LocalDateTime enteredAt;

    @Column(name = "exited_at")
    private LocalDateTime exitedAt;

    @Column(name = "days_spent")
    private Long daysSpent;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    // Phase 1: Track who performed this movement action
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "moved_by")
    private User movedBy;
}
