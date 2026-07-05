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
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository       departmentRepository;
    private final ProposalStageRepository    stageRepository;
    private final ProposalRepository         proposalRepository;
    private final ProposalMovementRepository movementRepository;
    private final ProposalItemRepository     itemRepository;
    private final ProposalSequenceRepository sequenceRepository;
    private final UserRepository             userRepository;

    @Override
    public void run(String... args) {
        boolean hasOldStages = stageRepository.existsByStageName("Section Officer") ||
                               stageRepository.existsByStageName("Accounts Officer") ||
                               stageRepository.existsByStageName("Senior Accounts Officer") ||
                               stageRepository.existsByStageName("FA&CAO");

        boolean alreadySeeded = stageRepository.existsByStageName("Executive Department") &&
                                stageRepository.existsByStageName("Accounts Department") &&
                                departmentRepository.count() > 0 &&
                                userRepository.count() > 0 &&
                                sequenceRepository.count() > 0;   // Phase 1: check sequence exists

        if (alreadySeeded) {
            log.info("Data already seeded (Phase 1). Skipping.");
            return;
        }

        boolean needsReset = hasOldStages ||
                             departmentRepository.count() > 0 ||
                             stageRepository.count() > 0 ||
                             userRepository.count() > 0;

        if (needsReset) {
            log.info("Stale or old-workflow data detected. Resetting database...");
            resetDatabase();
        }

        log.info("Seeding fresh data (Phase 1)...");
        seedData();
    }

    @Transactional
    public void resetDatabase() {
        itemRepository.deleteAll();
        movementRepository.deleteAll();
        proposalRepository.deleteAll();
        sequenceRepository.deleteAll();
        stageRepository.deleteAll();
        departmentRepository.deleteAll();
        userRepository.deleteAll();
        log.info("All tables cleared successfully.");
    }

    @Transactional
    public void seedData() {
        // ── Departments ────────────────────────────────────────────────────────
        Department engineering = save(new Department(), "Engineering");
        Department electrical  = save(new Department(), "Electrical");
        Department mechanical  = save(new Department(), "Mechanical");
        Department personnel   = save(new Department(), "Personnel");
        Department signal      = save(new Department(), "Signal & Telecom");

        List<Department> departments = List.of(engineering, electrical, mechanical, personnel, signal);

        // ── Users (Phase 1: each user assigned a department) ──────────────────
        User admin     = createUser("admin",     "admin123",   UserRole.ADMIN,          "System Administrator", "admin@nwr.gov.in",     engineering);
        User executive = createUser("executive", "exec123",    UserRole.EXECUTIVE_USER, "Executive Officer",    "executive@nwr.gov.in", electrical);
        User accounts  = createUser("accounts",  "acct123",    UserRole.ACCOUNTS_USER,  "Accounts Officer",     "accounts@nwr.gov.in",  mechanical);
        userRepository.saveAll(List.of(admin, executive, accounts));

        // ── Workflow Stages ────────────────────────────────────────────────────
        ProposalStage executiveDept = createStage("Executive Department", 1);
        ProposalStage accountsDept  = createStage("Accounts Department",  2);
        List<ProposalStage> stages  = List.of(executiveDept, accountsDept);

        // ── Proposal Sequence — seed for current year ─────────────────────────
        int year = LocalDate.now().getYear();
        ProposalSequence seq = new ProposalSequence(year, 0);
        sequenceRepository.save(seq);

        // ── Seed 50 Proposals ──────────────────────────────────────────────────
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

            Proposal proposal = new Proposal();
            proposal.setProposalNumber(proposalNumber);
            proposal.setProposalTitle(title);
            proposal.setDepartment(dept);
            proposal.setCurrentStage(currentStage);
            proposal.setStatus(status);
            proposal.setSubmissionDate(submissionDate);
            proposal.setCompletionDate(completionDate);
            proposal.setRemarks("Proposal submitted for review and approval.");
            proposal.setCreatedBy(admin);  // Phase 1: seed with admin as creator

            Proposal saved = proposalRepository.save(proposal);

            // Phase 1: Create 1–3 items per proposal
            int itemCount = rnd.nextInt(3) + 1;
            List<ProposalItem> items = new ArrayList<>();
            for (int j = 0; j < itemCount; j++) {
                ProposalItem item = new ProposalItem();
                item.setProposal(saved);
                item.setItemName(products[rnd.nextInt(products.length)]);
                item.setQuantity((rnd.nextInt(10) + 1) * 5);
                item.setUnit(j % 2 == 0 ? "pcs" : "units");
                BigDecimal offeredPrice = BigDecimal.valueOf(50000L + rnd.nextInt(500000));
                item.setOfferedPrice(offeredPrice);
                if (rnd.nextBoolean()) {
                    item.setMarketPrice(offeredPrice.add(BigDecimal.valueOf(rnd.nextInt(100000))));
                }
                item.setSortOrder(j);
                items.add(item);
            }
            itemRepository.saveAll(items);

            // Movements
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
                } else if (status == ProposalStatus.APPROVED || status == ProposalStatus.COMPLETED
                        || status == ProposalStatus.REJECTED) {
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
                movement.setMovedBy(executive);  // Phase 1: seed actor

                movementRepository.save(movement);
            }
        }

        // Phase 1: Update sequence to 50 (matches the 50 seeded proposals)
        seq.setLastSeq(50);
        sequenceRepository.save(seq);

        log.info("Seed complete (Phase 1): 3 users, 5 departments, 2 workflow stages, 50 proposals with items.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Department save(Department d, String name) {
        return departmentRepository.findByName(name).orElseGet(() -> {
            d.setName(name);
            return departmentRepository.save(d);
        });
    }

    private User createUser(String username, String password, UserRole role,
                             String fullName, String email, Department dept) {
        User u = new User();
        u.setUsername(username);
        u.setPassword(password);
        u.setRole(role);
        u.setFullName(fullName);
        u.setEmail(email);
        u.setDepartment(dept);
        u.setIsActive(true);
        return u;
    }

    private ProposalStage createStage(String name, int seq) {
        return stageRepository.findByStageName(name).orElseGet(() -> {
            ProposalStage s = new ProposalStage();
            s.setStageName(name);
            s.setSequenceNumber(seq);
            return stageRepository.save(s);
        });
    }
}
