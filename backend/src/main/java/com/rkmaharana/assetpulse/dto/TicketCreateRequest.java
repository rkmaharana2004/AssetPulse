package com.rkmaharana.assetpulse.dto;

import com.rkmaharana.assetpulse.model.TicketPriority;
import com.rkmaharana.assetpulse.model.TicketType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TicketCreateRequest {

    @NotBlank(message = "Asset ID is required")
    private String assetId;

    @NotNull(message = "Ticket type is required (BREAKDOWN or PREVENTATIVE)")
    private TicketType type;

    @NotNull(message = "Priority is required (LOW, MEDIUM, HIGH, CRITICAL)")
    private TicketPriority priority;

    @NotBlank(message = "Issue description is required")
    private String issueDescription;

    public TicketCreateRequest() {
    }

    public TicketCreateRequest(String assetId, TicketType type, TicketPriority priority, String issueDescription) {
        this.assetId = assetId;
        this.type = type;
        this.priority = priority;
        this.issueDescription = issueDescription;
    }

    public String getAssetId() {
        return assetId;
    }

    public void setAssetId(String assetId) {
        this.assetId = assetId;
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

    public String getIssueDescription() {
        return issueDescription;
    }

    public void setIssueDescription(String issueDescription) {
        this.issueDescription = issueDescription;
    }
}
