package com.nwr.finance.config;

import com.nwr.finance.entity.*;
import com.nwr.finance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final UserRepository userRepository;

    // ──────────────────────────────────────────────────────────────────────────
    // run() is intentionally NOT @Transactional so that resetDatabase() and
    // seedData() each execute in their own separate, committed transactions
    // (Spring proxy handles @Transactional on public methods called externally,
    // but private-method self-calls bypass the proxy — keeping run() without
    // @Transactional ensures each public sub-method gets its own transaction).
    // ──────────────────────────────────────────────────────────────────────────
    @Override
    public void run(String... args) {
        boolean hasOldStages = stageRepository.existsByStageName("Section Officer") ||
                               stageRepository.existsByStageName("Accounts Officer") ||
                               stageRepository.existsByStageName("Senior Accounts Officer") ||
                               stageRepository.existsByStageName("FA&CAO");

        boolean alreadySeeded = stageRepository.existsByStageName("Executive Department") &&
                                stageRepository.existsByStageName("Accounts Department") &&
                                departmentRepository.count() > 0 &&
                                userRepository.count() > 0;

        if (alreadySeeded) {
            log.info("Data already seeded with the 2-stage workflow. Skipping.");
            return;
        }

        // Reset when old stages or any stale data exist
        boolean needsReset = hasOldStages ||
                             departmentRepository.count() > 0 ||
                             stageRepository.count() > 0 ||
                             userRepository.count() > 0;

        if (needsReset) {
            log.info("Stale or old-workflow data detected. Resetting database...");
            resetDatabase();   // committed in its own transaction before seedData runs
        }

        log.info("Seeding fresh data...");
        seedData();            // committed in its own separate transaction
    }

    // Public so Spring proxy can apply @Transactional properly
    @Transactional
    public void resetDatabase() {
        movementRepository.deleteAll();
        proposalRepository.deleteAll();
        stageRepository.deleteAll();
        departmentRepository.deleteAll();
        userRepository.deleteAll();
        log.info("All tables cleared successfully.");
    }

    // Public so Spring proxy can apply @Transactional properly
    @Transactional
    public void seedData() {
        // ── Users ─────────────────────────────────────────────────────────────
        User admin = new User(null, "admin", "admin123", UserRole.ADMIN,
                "System Administrator", "admin@nwr.gov.in");
        User executive = new User(null, "executive", "exec123", UserRole.EXECUTIVE_USER,
                "Executive Officer", "executive@nwr.gov.in");
        User accounts = new User(null, "accounts", "acct123", UserRole.ACCOUNTS_USER,
                "Accounts Officer", "accounts@nwr.gov.in");
        userRepository.saveAll(List.of(admin, executive, accounts));

        // ── Departments ────────────────────────────────────────────────────────
        Department engineering = departmentRepository.findByName("Engineering")
                .orElseGet(() -> { Department d = new Department(); d.setName("Engineering"); return departmentRepository.save(d); });
        Department electrical = departmentRepository.findByName("Electrical")
                .orElseGet(() -> { Department d = new Department(); d.setName("Electrical"); return departmentRepository.save(d); });
        Department mechanical = departmentRepository.findByName("Mechanical")
                .orElseGet(() -> { Department d = new Department(); d.setName("Mechanical"); return departmentRepository.save(d); });
        Department personnel = departmentRepository.findByName("Personnel")
                .orElseGet(() -> { Department d = new Department(); d.setName("Personnel"); return departmentRepository.save(d); });
        Department signal = departmentRepository.findByName("Signal & Telecom")
                .orElseGet(() -> { Department d = new Department(); d.setName("Signal & Telecom"); return departmentRepository.save(d); });

        List<Department> departments = List.of(engineering, electrical, mechanical, personnel, signal);

        // ── Workflow Stages ────────────────────────────────────────────────────
        ProposalStage executiveDept = stageRepository.findByStageName("Executive Department")
                .orElseGet(() -> { ProposalStage s = new ProposalStage(); s.setStageName("Executive Department"); s.setSequenceNumber(1); return stageRepository.save(s); });
        ProposalStage accountsDept = stageRepository.findByStageName("Accounts Department")
                .orElseGet(() -> { ProposalStage s = new ProposalStage(); s.setStageName("Accounts Department"); s.setSequenceNumber(2); return stageRepository.save(s); });

        List<ProposalStage> stages = List.of(executiveDept, accountsDept);

        // ── Seed Proposals ─────────────────────────────────────────────────────
        Random rnd = new Random(42);

        String[] titles = {
            "Annual Budget Allocation for Infrastructure",
            "Track Renewal Works Phase-1",
            "Signal System Upgrade",
            "Safety Equipment Procurement",
            "Workshop Expansion Plan",
            "Electrification Project Phase-2",
            "Platform Extension Works",
            "Level Crossing Improvement",
            "Water Supply System Modernisation",
            "Staff Quarter Construction",
            "Medical Equipment Procurement",
            "Vehicle Fleet Replacement",
            "Office Renovation Plan",
            "Communication System Upgrade",
            "Diesel Loco Overhaul Programme",
            "EMU Coaching Maintenance",
            "Passenger Amenities Improvement",
            "Yard Remodeling Project",
            "Crane Procurement",
            "Welding Equipment Purchase",
            "Overhead Equipment Maintenance",
            "Sub-Station Construction",
            "Cable Replacement Works",
            "Generator Procurement",
            "Solar Panel Installation",
            "CCTV System Installation",
            "Flood Protection Works",
            "Culvert Repair Works",
            "Tunnel Inspection Equipment",
            "Track Geometry Car Purchase",
            "OHE Mast Replacement",
            "Power Car Procurement",
            "Coach Painting Works",
            "Wheel Profile Maintenance",
            "AC Plant Overhaul",
            "Brake System Upgrade",
            "Fire Detection System",
            "Sewage Treatment Plant",
            "Garbage Disposal System",
            "Rain Water Harvesting",
            "LED Lighting Replacement",
            "Foot Over Bridge Construction",
            "Parking Facility Development",
            "Cafeteria Setup",
            "IT System Upgrade Proposal",
            "Bridge Rehabilitation Project",
            "Station Modernisation Plan",
            "Staff Training Program 2026",
            "Equipment Procurement for Maintenance",
            "Switchgear Replacement Works"
        };

        String[] products = {
            "Steel Rails", "Signal Equipment", "Safety Kits", "Workshop Machinery",
            "Electrical Panels", "Platform Tiles", "CCTV Cameras", "Water Pumps",
            "Office Furniture", "Medical Devices", "Diesel Vehicles", "Network Switches",
            "Coaching Parts", "Overhead Wire", "Solar Panels", "Generator Sets",
            "Fire Sensors", "LED Fixtures", "Construction Material", "IT Servers",
            "Brake Components", "AC Units", "Welding Machines", "Cranes",
            "Track Machines", "Power Cars", "OHE Masts", "Cable Drums"
        };

        int year = LocalDate.now().getYear();
        String prefix = "FW-" + year + "-";

        for (int i = 1; i <= 50; i++) {
            String proposalNumber = prefix + String.format("%03d", i);
            String title = titles[i - 1];
            Department dept = departments.get(rnd.nextInt(departments.size()));

            int stageCount = rnd.nextInt(2) + 1;
            ProposalStage currentStage = stages.get(Math.min(stageCount - 1, stages.size() - 1));

            ProposalStatus status;
            LocalDate submissionDate = LocalDate.now().minusDays(rnd.nextInt(120) + 5);
            LocalDate completionDate = null;

            if (stageCount == 2 && rnd.nextBoolean()) {
                status = rnd.nextBoolean() ? ProposalStatus.APPROVED : ProposalStatus.COMPLETED;
                completionDate = LocalDate.now().minusDays(rnd.nextInt(10));
            } else if (rnd.nextInt(10) < 2) {
                status = ProposalStatus.RETURNED;
            } else if (rnd.nextInt(10) < 1) {
                status = ProposalStatus.REJECTED;
            } else if (stageCount == 1) {
                status = ProposalStatus.PENDING;
            } else {
                status = ProposalStatus.UNDER_REVIEW;
            }

            String productName = products[rnd.nextInt(products.length)];
            int qty = (rnd.nextInt(10) + 1) * 5;
            BigDecimal offeredPrice = BigDecimal.valueOf(50000L + rnd.nextInt(5000000));
            BigDecimal marketPrice = rnd.nextBoolean()
                    ? offeredPrice.add(BigDecimal.valueOf(rnd.nextInt(200000)))
                    : null;

            Proposal proposal = new Proposal();
            proposal.setProposalNumber(proposalNumber);
            proposal.setProposalTitle(title);
            proposal.setDepartment(dept);
            proposal.setCurrentStage(currentStage);
            proposal.setStatus(status);
            proposal.setSubmissionDate(submissionDate);
            proposal.setCompletionDate(completionDate);
            proposal.setRemarks("Proposal submitted for review and approval.");
            proposal.setProductName(productName);
            proposal.setProductQuantity(qty);
            proposal.setOfferedPrice(offeredPrice);
            proposal.setMarketPrice(marketPrice);

            Proposal saved = proposalRepository.save(proposal);

            LocalDateTime baseTime = submissionDate.atStartOfDay().plusHours(9);

            for (int s = 0; s < stageCount; s++) {
                ProposalStage fromStage = s == 0 ? null : stages.get(s - 1);
                ProposalStage toStage   = stages.get(s);

                int daysAtStage = rnd.nextInt(20) + 1;
                LocalDateTime enteredAt = baseTime;
                LocalDateTime exitedAt  = null;
                Long daysSpent          = null;

                boolean isLastStage = (s == stageCount - 1);

                if (!isLastStage) {
                    exitedAt  = enteredAt.plusDays(daysAtStage).plusHours(rnd.nextInt(8));
                    daysSpent = (long) daysAtStage;
                    baseTime  = exitedAt;
                } else if (status == ProposalStatus.APPROVED ||
                           status == ProposalStatus.COMPLETED ||
                           status == ProposalStatus.REJECTED) {
                    exitedAt  = enteredAt.plusDays(daysAtStage).plusHours(rnd.nextInt(8));
                    daysSpent = (long) daysAtStage;
                }

                ProposalMovement movement = new ProposalMovement();
                movement.setProposal(saved);
                movement.setFromStage(fromStage);
                movement.setToStage(toStage);
                movement.setEnteredAt(enteredAt);
                movement.setExitedAt(exitedAt);
                movement.setDaysSpent(daysSpent);
                movement.setRemarks(s == 0
                        ? "Initial submission to " + toStage.getStageName()
                        : "Moved from " + fromStage.getStageName() + " to " + toStage.getStageName());

                movementRepository.save(movement);
            }
        }

        log.info("Seed complete: 3 users, 5 departments, 2 workflow stages, 50 proposals.");
    }
}
