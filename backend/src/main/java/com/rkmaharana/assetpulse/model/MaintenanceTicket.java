package com.rkmaharana.assetpulse.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "maintenance_tickets")
public class MaintenanceTicket {

    @Id
    private String id;

    @Indexed(unique = true)
    private String ticketCode;

    private String assetId;

    private String assetCode;

    private TicketType type;

    private TicketPriority priority;

    private TicketStatus status = TicketStatus.OPEN;

    private String issueDescription;

    private String resolutionNotes;

    private int downtimeMinutes = 0;

    private List<PartUsage> partsUsed = new ArrayList<>();

    private String openedBy;

    private Instant openedAt = Instant.now();

    private Instant closedAt;

    public MaintenanceTicket() {
    }

    public MaintenanceTicket(String ticketCode, String assetId, String assetCode, TicketType type, TicketPriority priority, String issueDescription, String openedBy) {
        this.ticketCode = ticketCode;
        this.assetId = assetId;
        this.assetCode = assetCode;
        this.type = type;
        this.priority = priority;
        this.issueDescription = issueDescription;
        this.openedBy = openedBy;
        this.status = TicketStatus.OPEN;
        this.openedAt = Instant.now();
        this.partsUsed = new ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTicketCode() {
        return ticketCode;
    }

    public void setTicketCode(String ticketCode) {
        this.ticketCode = ticketCode;
    }

    public String getAssetId() {
        return assetId;
    }

    public void setAssetId(String assetId) {
        this.assetId = assetId;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public void setAssetCode(String assetCode) {
        this.assetCode = assetCode;
    }

    public TicketType getType() {
        return type;
    }

    public void setType(TicketType type) {
        this.type = type;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public void setPriority(TicketPriority priority) {
        this.priority = priority;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public String getIssueDescription() {
        return issueDescription;
    }

    public void setIssueDescription(String issueDescription) {
        this.issueDescription = issueDescription;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public int getDowntimeMinutes() {
        return downtimeMinutes;
    }

    public void setDowntimeMinutes(int downtimeMinutes) {
        this.downtimeMinutes = downtimeMinutes;
    }

    public List<PartUsage> getPartsUsed() {
        return partsUsed;
    }

    public void setPartsUsed(List<PartUsage> partsUsed) {
        this.partsUsed = partsUsed;
    }

    public String getOpenedBy() {
        return openedBy;
    }

    public void setOpenedBy(String openedBy) {
        this.openedBy = openedBy;
    }

    public Instant getOpenedAt() {
        return openedAt;
    }

    public void setOpenedAt(Instant openedAt) {
        this.openedAt = openedAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
    }
}
