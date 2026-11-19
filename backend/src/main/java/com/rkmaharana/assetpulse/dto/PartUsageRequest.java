package com.rkmaharana.assetpulse.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class PartUsageRequest {

    @NotBlank(message = "Part ID is required")
    private String partId;

    @Positive(message = "Quantity used must be greater than zero")
    private int quantityUsed;

    public PartUsageRequest() {
    }

    public PartUsageRequest(String partId, int quantityUsed) {
        this.partId = partId;
        this.quantityUsed = quantityUsed;
    }

    public String getPartId() {
        return partId;
    }

    public void setPartId(String partId) {
        this.partId = partId;
    }

    public int getQuantityUsed() {
        return quantityUsed;
    }

    public void setQuantityUsed(int quantityUsed) {
        this.quantityUsed = quantityUsed;
    }
}
