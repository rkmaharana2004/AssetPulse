package com.rkmaharana.assetpulse.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.ArrayList;
import java.util.List;

public class TicketCloseRequest {

    @NotBlank(message = "Resolution notes are required")
    private String resolutionNotes;

    @PositiveOrZero(message = "Downtime minutes cannot be negative")
    private int downtimeMinutes;

    @Valid
    private List<PartUsageRequest> partsUsed = new ArrayList<>();

    public TicketCloseRequest() {
    }

    public TicketCloseRequest(String resolutionNotes, int downtimeMinutes, List<PartUsageRequest> partsUsed) {
        this.resolutionNotes = resolutionNotes;
        this.downtimeMinutes = downtimeMinutes;
        this.partsUsed = partsUsed != null ? partsUsed : new ArrayList<>();
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

    public List<PartUsageRequest> getPartsUsed() {
        return partsUsed;
    }

    public void setPartsUsed(List<PartUsageRequest> partsUsed) {
        this.partsUsed = partsUsed;
    }
}
