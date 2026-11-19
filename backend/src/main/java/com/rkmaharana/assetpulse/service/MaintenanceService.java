package com.rkmaharana.assetpulse.service;

import com.rkmaharana.assetpulse.dto.DowntimeSummaryDTO;
import com.rkmaharana.assetpulse.dto.PartUsageRequest;
import com.rkmaharana.assetpulse.dto.TicketCloseRequest;
import com.rkmaharana.assetpulse.dto.TicketCreateRequest;
import com.rkmaharana.assetpulse.exception.InsufficientStockException;
import com.rkmaharana.assetpulse.exception.ResourceNotFoundException;
import com.rkmaharana.assetpulse.model.Asset;
import com.rkmaharana.assetpulse.model.AssetStatus;
import com.rkmaharana.assetpulse.model.MaintenanceTicket;
import com.rkmaharana.assetpulse.model.PartUsage;
import com.rkmaharana.assetpulse.model.SparePart;
import com.rkmaharana.assetpulse.model.TicketPriority;
import com.rkmaharana.assetpulse.model.TicketStatus;
import com.rkmaharana.assetpulse.model.TicketType;
import com.rkmaharana.assetpulse.repository.AssetRepository;
import com.rkmaharana.assetpulse.repository.MaintenanceTicketRepository;
import com.rkmaharana.assetpulse.repository.SparePartRepository;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class MaintenanceService {

    private final MaintenanceTicketRepository ticketRepository;
    private final AssetRepository assetRepository;
    private final SparePartRepository sparePartRepository;
    private final MongoTemplate mongoTemplate;

    public MaintenanceService(
            MaintenanceTicketRepository ticketRepository,
            AssetRepository assetRepository,
            SparePartRepository sparePartRepository,
            MongoTemplate mongoTemplate
    ) {
        this.ticketRepository = ticketRepository;
        this.assetRepository = assetRepository;
        this.sparePartRepository = sparePartRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public MaintenanceTicket createTicket(TicketCreateRequest request, String openedBy) {
        Asset asset = assetRepository.findById(request.getAssetId())
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + request.getAssetId()));

        // Automatic Asset Status Sync: BREAKDOWN changes asset status to UNDER_MAINTENANCE
        if (request.getType() == TicketType.BREAKDOWN) {
            asset.setStatus(AssetStatus.UNDER_MAINTENANCE);
            assetRepository.save(asset);
        }

        String ticketCode = generateTicketCode();
        MaintenanceTicket ticket = new MaintenanceTicket(
                ticketCode,
                asset.getId(),
                asset.getAssetCode(),
                request.getType(),
                request.getPriority(),
                request.getIssueDescription(),
                openedBy != null ? openedBy : "system"
        );

        return ticketRepository.save(ticket);
    }

    public MaintenanceTicket closeTicket(String ticketId, TicketCloseRequest request) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance ticket not found with id: " + ticketId));

        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new IllegalStateException("Ticket '" + ticket.getTicketCode() + "' is already closed");
        }

        // Domain Rule 1: Atomic Spare-Part Stock Deduction
        List<SparePart> partsToDeduct = new ArrayList<>();
        List<PartUsage> snapshotPartsUsed = new ArrayList<>();

        if (request.getPartsUsed() != null && !request.getPartsUsed().isEmpty()) {
            // Validation Phase: verify stock availability for ALL items prior to updating any item
            for (PartUsageRequest usageReq : request.getPartsUsed()) {
                SparePart part = sparePartRepository.findById(usageReq.getPartId())
                        .orElseThrow(() -> new ResourceNotFoundException("Spare part not found with id: " + usageReq.getPartId()));

                if (part.getStockQuantity() < usageReq.getQuantityUsed()) {
                    throw new InsufficientStockException(String.format(
                            "Insufficient stock for part '%s' (%s). Available: %d, Requested: %d",
                            part.getName(), part.getPartNumber(), part.getStockQuantity(), usageReq.getQuantityUsed()
                    ));
                }
                partsToDeduct.add(part);
                snapshotPartsUsed.add(new PartUsage(
                        part.getId(),
                        part.getPartNumber(),
                        usageReq.getQuantityUsed(),
                        part.getUnitCost()
                ));
            }

            // Deduction Phase: only performed if validation succeeds for all parts
            for (int i = 0; i < partsToDeduct.size(); i++) {
                SparePart part = partsToDeduct.get(i);
                int quantityUsed = request.getPartsUsed().get(i).getQuantityUsed();
                part.setStockQuantity(part.getStockQuantity() - quantityUsed);
                sparePartRepository.save(part);
            }
        }

        ticket.setPartsUsed(snapshotPartsUsed);
        ticket.setResolutionNotes(request.getResolutionNotes());
        ticket.setDowntimeMinutes(request.getDowntimeMinutes());
        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(Instant.now());

        // Domain Rule 2: Automatic Asset Status Synchronization
        // Closing restores asset to OPERATIONAL, updates lastServicedDate & nextServiceDueDate
        if (ticket.getAssetId() != null) {
            Optional<Asset> assetOpt = assetRepository.findById(ticket.getAssetId());
            if (assetOpt.isPresent()) {
                Asset asset = assetOpt.get();
                asset.setStatus(AssetStatus.OPERATIONAL);
                LocalDate today = LocalDate.now();
                asset.setLastServicedDate(today);
                asset.setNextServiceDueDate(today.plusDays(asset.getServiceIntervalDays()));
                assetRepository.save(asset);
            }
        }

        return ticketRepository.save(ticket);
    }

    public List<MaintenanceTicket> getTickets(TicketStatus status, TicketType type, String assetId) {
        List<MaintenanceTicket> tickets = ticketRepository.findAll();
        return tickets.stream()
                .filter(t -> status == null || t.getStatus() == status)
                .filter(t -> type == null || t.getType() == type)
                .filter(t -> assetId == null || assetId.trim().isEmpty() || (t.getAssetId() != null && t.getAssetId().equals(assetId.trim())))
                .sorted((a, b) -> b.getOpenedAt().compareTo(a.getOpenedAt()))
                .toList();
    }

    public MaintenanceTicket getTicketById(String id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance ticket not found with id: " + id));
    }

    /**
     * Domain Rule 3: Downtime & Cost Aggregation Pipeline
     * Aggregates closed maintenance tickets grouped by assetId.
     */
    public List<DowntimeSummaryDTO> getDowntimeAnalytics() {
        AggregationOperation matchClosed = context -> Document.parse("{ $match: { status: 'CLOSED' } }");

        AggregationOperation projectMetrics = context -> Document.parse(
                "{ $project: { " +
                "    assetId: 1, " +
                "    assetCode: 1, " +
                "    type: 1, " +
                "    downtimeMinutes: { $ifNull: ['$downtimeMinutes', 0] }, " +
                "    isBreakdown: { $cond: [ { $eq: ['$type', 'BREAKDOWN'] }, 1, 0 ] }, " +
                "    ticketPartsCost: { " +
                "        $reduce: { " +
                "            input: { $ifNull: ['$partsUsed', []] }, " +
                "            initialValue: 0, " +
                "            in: { $add: ['$$value', { $multiply: ['$$this.quantityUsed', '$$this.unitCostAtTime'] }] } " +
                "        } " +
                "    } " +
                "} }"
        );

        AggregationOperation groupMetrics = context -> Document.parse(
                "{ $group: { " +
                "    _id: '$assetId', " +
                "    assetCode: { $first: '$assetCode' }, " +
                "    totalDowntimeMinutes: { $sum: '$downtimeMinutes' }, " +
                "    breakdownCount: { $sum: '$isBreakdown' }, " +
                "    totalPartsCost: { $sum: '$ticketPartsCost' } " +
                "} }"
        );

        Aggregation aggregation = Aggregation.newAggregation(matchClosed, projectMetrics, groupMetrics);
        AggregationResults<Document> results = mongoTemplate.aggregate(aggregation, "maintenance_tickets", Document.class);

        List<DowntimeSummaryDTO> summaries = new ArrayList<>();
        for (Document doc : results.getMappedResults()) {
            String assetId = doc.getString("_id");
            String assetCode = doc.getString("assetCode");
            Number downtimeNum = doc.get("totalDowntimeMinutes", Number.class);
            long downtimeMinutes = downtimeNum != null ? downtimeNum.longValue() : 0L;
            Number breakdownNum = doc.get("breakdownCount", Number.class);
            long breakdownCount = breakdownNum != null ? breakdownNum.longValue() : 0L;
            Number costNum = doc.get("totalPartsCost", Number.class);
            double totalCost = costNum != null ? costNum.doubleValue() : 0.0;

            String assetName = "Unknown Asset";
            if (assetId != null) {
                Optional<Asset> assetOpt = assetRepository.findById(assetId);
                if (assetOpt.isPresent()) {
                    assetName = assetOpt.get().getName();
                    if (assetCode == null) {
                        assetCode = assetOpt.get().getAssetCode();
                    }
                }
            }

            double downtimeHours = Math.round((downtimeMinutes / 60.0) * 10.0) / 10.0;

            summaries.add(new DowntimeSummaryDTO(
                    assetId,
                    assetCode,
                    assetName,
                    downtimeMinutes,
                    downtimeHours,
                    breakdownCount,
                    Math.round(totalCost * 100.0) / 100.0
            ));
        }

        return summaries;
    }

    private String generateTicketCode() {
        int year = Year.now().getValue();
        int randomNum = ThreadLocalRandom.current().nextInt(100, 999);
        long count = ticketRepository.count() + 1;
        String code = String.format("MNT-%d-%03d", year, (count + randomNum) % 1000);
        while (ticketRepository.existsByTicketCode(code)) {
            randomNum = ThreadLocalRandom.current().nextInt(1000, 9999);
            code = String.format("MNT-%d-%04d", year, randomNum);
        }
        return code;
    }
}
