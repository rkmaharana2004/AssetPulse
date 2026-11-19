package com.rkmaharana.assetpulse.service;

import com.rkmaharana.assetpulse.model.Asset;
import com.rkmaharana.assetpulse.model.AssetStatus;
import com.rkmaharana.assetpulse.model.MaintenanceTicket;
import com.rkmaharana.assetpulse.model.PartUsage;
import com.rkmaharana.assetpulse.model.Role;
import com.rkmaharana.assetpulse.model.SparePart;
import com.rkmaharana.assetpulse.model.TicketPriority;
import com.rkmaharana.assetpulse.model.TicketStatus;
import com.rkmaharana.assetpulse.model.TicketType;
import com.rkmaharana.assetpulse.model.User;
import com.rkmaharana.assetpulse.repository.AssetRepository;
import com.rkmaharana.assetpulse.repository.MaintenanceTicketRepository;
import com.rkmaharana.assetpulse.repository.SparePartRepository;
import com.rkmaharana.assetpulse.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final SparePartRepository sparePartRepository;
    private final MaintenanceTicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(
            UserRepository userRepository,
            AssetRepository assetRepository,
            SparePartRepository sparePartRepository,
            MaintenanceTicketRepository ticketRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.assetRepository = assetRepository;
        this.sparePartRepository = sparePartRepository;
        this.ticketRepository = ticketRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedAssets();
        seedSpareParts();
        seedSampleTickets();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            log.info("Seeding initial users (admin, engineer, viewer)...");
            User admin = new User("admin", passwordEncoder.encode("admin123"), "Rupesh Maharana", Role.ADMIN);
            User engineer = new User("engineer", passwordEncoder.encode("eng123"), "Alex Mercer", Role.ENGINEER);
            User viewer = new User("viewer", passwordEncoder.encode("view123"), "Sarah Jenkins", Role.VIEWER);

            userRepository.saveAll(List.of(admin, engineer, viewer));
            log.info("Successfully seeded 3 system users.");
        }
    }

    private void seedAssets() {
        if (assetRepository.count() == 0) {
            log.info("Seeding industrial equipment fleet...");
            LocalDate now = LocalDate.now();

            Asset cnc = new Asset();
            cnc.setAssetCode("CNC-MILL-02");
            cnc.setName("5-Axis CNC Milling Machine");
            cnc.setDepartment("Precision Machining");
            cnc.setManufacturer("Haas Automation");
            cnc.setStatus(AssetStatus.OPERATIONAL);
            cnc.setServiceIntervalDays(90);
            cnc.setLastServicedDate(now.minusDays(30));
            cnc.setNextServiceDueDate(now.plusDays(60));
            cnc.setCreatedAt(Instant.now().minus(90, ChronoUnit.DAYS));

            Asset press = new Asset();
            press.setAssetCode("HYD-PRESS-01");
            press.setName("500-Ton Hydraulic Forging Press");
            press.setDepartment("Heavy Fabrication");
            press.setManufacturer("Schuler Group");
            press.setStatus(AssetStatus.UNDER_MAINTENANCE); // Synced with active breakdown ticket
            press.setServiceIntervalDays(180);
            press.setLastServicedDate(now.minusDays(120));
            press.setNextServiceDueDate(now.plusDays(60));
            press.setCreatedAt(Instant.now().minus(180, ChronoUnit.DAYS));

            Asset laser = new Asset();
            laser.setAssetCode("LASER-CUT-04");
            laser.setName("Fiber Laser Cutting System 12kW");
            laser.setDepartment("Sheet Metal Processing");
            laser.setManufacturer("Trumpf");
            laser.setStatus(AssetStatus.OPERATIONAL);
            laser.setServiceIntervalDays(60);
            laser.setLastServicedDate(now.minusDays(50));
            laser.setNextServiceDueDate(now.plusDays(10));
            laser.setCreatedAt(Instant.now().minus(120, ChronoUnit.DAYS));

            Asset robot = new Asset();
            robot.setAssetCode("ROBOT-ARM-03");
            robot.setName("6-Axis Articulated Welding Robot");
            robot.setDepartment("Automated Assembly");
            robot.setManufacturer("KUKA Robotics");
            robot.setStatus(AssetStatus.OPERATIONAL);
            robot.setServiceIntervalDays(120);
            robot.setLastServicedDate(now.minusDays(20));
            robot.setNextServiceDueDate(now.plusDays(100));
            robot.setCreatedAt(Instant.now().minus(60, ChronoUnit.DAYS));

            assetRepository.saveAll(List.of(cnc, press, laser, robot));
            log.info("Successfully seeded 4 industrial assets.");
        }
    }

    private void seedSpareParts() {
        if (sparePartRepository.count() == 0) {
            log.info("Seeding spare-part catalog & inventory bins...");
            SparePart p1 = new SparePart("BRG-7208-AC", "Angular Contact Spindle Bearing", 14, 5, 3450.00, "RACK-B2");
            // Low stock items (stockQuantity <= reorderLevel)
            SparePart p2 = new SparePart("HYD-SEAL-90", "High-Pressure Hydraulic Seal Kit", 3, 6, 1250.00, "BIN-A4");
            SparePart p3 = new SparePart("NOZ-FL-20", "Laser Focus Ceramic Nozzle 2.0mm", 4, 8, 890.00, "CABINET-L1");
            SparePart p4 = new SparePart("BELT-SYN-32", "Heavy Duty Synchronous Drive Belt", 18, 4, 520.00, "RACK-D1");
            SparePart p5 = new SparePart("OIL-ISO-VG46", "Hydraulic Oil Synthetic ISO VG 46 (20L)", 7, 10, 2800.00, "DRUM-BAY-03");

            sparePartRepository.saveAll(List.of(p1, p2, p3, p4, p5));
            log.info("Successfully seeded 5 spare parts.");
        }
    }

    private void seedSampleTickets() {
        if (ticketRepository.count() == 0) {
            log.info("Seeding initial maintenance tickets...");
            Asset cnc = assetRepository.findByAssetCode("CNC-MILL-02").orElse(null);
            Asset press = assetRepository.findByAssetCode("HYD-PRESS-01").orElse(null);
            SparePart bearing = sparePartRepository.findByPartNumber("BRG-7208-AC").orElse(null);

            if (cnc != null && bearing != null) {
                // Historical Closed Ticket for CNC
                MaintenanceTicket closedTicket = new MaintenanceTicket();
                closedTicket.setTicketCode("MNT-2026-031");
                closedTicket.setAssetId(cnc.getId());
                closedTicket.setAssetCode(cnc.getAssetCode());
                closedTicket.setType(TicketType.BREAKDOWN);
                closedTicket.setPriority(TicketPriority.HIGH);
                closedTicket.setStatus(TicketStatus.CLOSED);
                closedTicket.setIssueDescription("Spindle vibration exceeding threshold during high-RPM pass");
                closedTicket.setResolutionNotes("Replaced front spindle bearing assembly and re-aligned");
                closedTicket.setDowntimeMinutes(185);
                closedTicket.setOpenedBy("engineer");
                closedTicket.setOpenedAt(Instant.now().minus(2, ChronoUnit.DAYS));
                closedTicket.setClosedAt(Instant.now().minus(2, ChronoUnit.DAYS).plus(185, ChronoUnit.MINUTES));

                PartUsage usage = new PartUsage(bearing.getId(), bearing.getPartNumber(), 2, 3450.00);
                closedTicket.setPartsUsed(List.of(usage));

                ticketRepository.save(closedTicket);
            }

            if (press != null) {
                // Active Open Breakdown Ticket on Hydraulic Press
                MaintenanceTicket openTicket = new MaintenanceTicket();
                openTicket.setTicketCode("MNT-2026-042");
                openTicket.setAssetId(press.getId());
                openTicket.setAssetCode(press.getAssetCode());
                openTicket.setType(TicketType.BREAKDOWN);
                openTicket.setPriority(TicketPriority.CRITICAL);
                openTicket.setStatus(TicketStatus.OPEN);
                openTicket.setIssueDescription("Main cylinder pressure drop detected under peak tonnage");
                openTicket.setOpenedBy("admin");
                openTicket.setOpenedAt(Instant.now().minus(4, ChronoUnit.HOURS));

                ticketRepository.save(openTicket);
            }

            log.info("Successfully seeded initial maintenance tickets.");
        }
    }
}
