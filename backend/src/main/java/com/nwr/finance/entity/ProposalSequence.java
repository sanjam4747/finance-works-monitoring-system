package com.nwr.finance.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "proposal_sequences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalSequence {

    @Id
    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "last_seq", nullable = false)
    private Integer lastSeq = 0;
}
