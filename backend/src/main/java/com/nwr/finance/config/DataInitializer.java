package com.nwr.finance.config;

import com.nwr.finance.entity.*;
import com.nwr.finance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final ProposalStageRepository stageRepository;
    private final ProposalRepository proposalRepository;
    private final ProposalMovementRepository movementRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (departmentRepository.count() > 0) {
            log.info("Data already initialized. Skipping seed.");
            return;
        }

        log.info("Initializing seed data...");

        // Create Departments
        Department engineering = createDept("Engineering");
        Department electrical = createDept("Electrical");
        Department mechanical = createDept("Mechanical");
        Department personnel = createDept("Personnel");
        Department signal = createDept("Signal & Telecom");

        List<Department> departments = List.of(engineering, electrical, mechanical, personnel, signal);

        // Create Stages
        ProposalStage sectionOfficer = createStage("Section Officer", 1);
        ProposalStage accountsOfficer = createStage("Accounts Officer", 2);
        ProposalStage seniorAccountsOfficer = createStage("Senior Accounts Officer", 3);
        ProposalStage facao = createStage("FA&CAO", 4);

        List<ProposalStage> stages = List.of(sectionOfficer, accountsOfficer, seniorAccountsOfficer, facao);

        Random random = new Random(42);

        String[] proposalTitles = {
            "Annual Budget Allocation for Infrastructure", "Equipment Procurement for Maintenance",
            "Staff Training Program 2024", "IT System Upgrade Proposal", "Bridge Rehabilitation Project",
            "Track Renewal Works Phase-1", "Station Modernization Plan", "Signal System Upgrade",
            "Safety Equipment Procurement", "Workshop Expansion Plan", "Electrification Project",
            "Platform Extension Works", "Level Crossing Improvement", "Water Supply System",
            "Staff Quarter Construction", "Medical Equipment Procurement", "Vehicle Fleet Replacement",
            "Warehouse Construction", "Office Renovation Plan", "Communication System Upgrade",
            "Diesel Loco Overhaul", "EMU Coaching Maintenance", "Passenger Amenities Improvement",
            "Yard Remodeling Project", "Crane Procurement", "Welding Equipment Purchase",
            "Overhead Equipment Maintenance", "Sub-Station Construction", "Cable Replacement Works",
            "Generator Procurement", "Solar Panel Installation", "CCTV System Installation",
            "Flood Protection Works", "Culvert Repair Works", "Tunnel Inspection Equipment",
            "Track Geometry Car", "OHE Mast Replacement", "Power Car Procurement",
            "Coach Painting Works", "Wheel Profile Maintenance", "AC Plant Overhaul",
            "Brake System Upgrade", "Fire Detection System", "Sewage Treatment Plant",
            "Garbage Disposal System", "Rain Water Harvesting", "LED Lighting Replacement",
            "Foot Over Bridge Construction", "Parking Facility Development", "Cafeteria Setup"
        };

        ProposalStatus[] statuses = ProposalStatus.values();

        for (int i = 1; i <= 50; i++) {
            String proposalNumber = String.format("FW-%04d", i);
            String title = proposalTitles[i - 1];
            Department dept = departments.get(random.nextInt(departments.size()));

            Proposal proposal = new Proposal();
            proposal.setProposalNumber(proposalNumber);
            proposal.setProposalTitle(title);
            proposal.setDepartment(dept);
            proposal.setSubmissionDate(LocalDate.now().minusDays(random.nextInt(120) + 5));
            proposal.setRemarks("Proposal submitted for review and approval.");

            // Determine how many stages this proposal has passed through
            int stageCount = random.nextInt(4) + 1; // 1 to 4 stages
            ProposalStage currentStage = stages.get(Math.min(stageCount - 1, stages.size() - 1));
            proposal.setCurrentStage(currentStage);

            // Assign a meaningful status
            ProposalStatus status;
            if (stageCount == 4 && random.nextBoolean()) {
                status = random.nextBoolean() ? ProposalStatus.APPROVED : ProposalStatus.COMPLETED;
                proposal.setCompletionDate(LocalDate.now().minusDays(random.nextInt(10)));
            } else if (random.nextInt(10) < 2) {
                status = ProposalStatus.RETURNED;
            } else if (random.nextInt(10) < 1) {
                status = ProposalStatus.REJECTED;
            } else if (stageCount == 1) {
                status = ProposalStatus.PENDING;
            } else {
                status = ProposalStatus.UNDER_REVIEW;
            }
            proposal.setStatus(status);

            Proposal savedProposal = proposalRepository.save(proposal);

            // Create movement records for each stage the proposal passed through
            LocalDateTime baseTime = proposal.getSubmissionDate().atStartOfDay().plusHours(9);

            for (int s = 0; s < stageCount; s++) {
                ProposalStage fromStage = s == 0 ? null : stages.get(s - 1);
                ProposalStage toStage = stages.get(s);

                int daysAtThisStage = random.nextInt(20) + 1;

                LocalDateTime enteredAt = baseTime;
                LocalDateTime exitedAt = null;
                Long daysSpent = null;

                boolean isLastStage = (s == stageCount - 1);

                if (!isLastStage) {
                    // Exited stage
                    exitedAt = enteredAt.plusDays(daysAtThisStage).plusHours(random.nextInt(8));
                    daysSpent = (long) daysAtThisStage;
                    baseTime = exitedAt;
                } else if (status == ProposalStatus.APPROVED || status == ProposalStatus.COMPLETED || status == ProposalStatus.REJECTED) {
                    // Final stage with exit
                    exitedAt = enteredAt.plusDays(daysAtThisStage).plusHours(random.nextInt(8));
                    daysSpent = (long) daysAtThisStage;
                }
                // else: still pending at this stage, no exit

                ProposalMovement movement = new ProposalMovement();
                movement.setProposal(savedProposal);
                movement.setFromStage(fromStage);
                movement.setToStage(toStage);
                movement.setEnteredAt(enteredAt);
                movement.setExitedAt(exitedAt);
                movement.setDaysSpent(daysSpent);

                if (s == 0) {
                    movement.setRemarks("Initial submission to " + toStage.getStageName());
                } else {
                    movement.setRemarks("Moved from " + fromStage.getStageName() + " to " + toStage.getStageName());
                }

                movementRepository.save(movement);
            }
        }

        log.info("Seed data initialized: 5 departments, 4 stages, 50 proposals with movement history.");
    }

    private Department createDept(String name) {
        Department dept = new Department();
        dept.setName(name);
        return departmentRepository.save(dept);
    }

    private ProposalStage createStage(String name, int seq) {
        ProposalStage stage = new ProposalStage();
        stage.setStageName(name);
        stage.setSequenceNumber(seq);
        return stageRepository.save(stage);
    }
}
