package com.rkmaharana.assetpulse.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class SparePartRequest {

    @NotBlank(message = "Part number is required")
    private String partNumber;

    @NotBlank(message = "Part name is required")
    private String name;

    @Min(value = 0, message = "Stock quantity cannot be negative")
    private int stockQuantity;

    @Min(value = 0, message = "Reorder level cannot be negative")
    private int reorderLevel;

    @Positive(message = "Unit cost must be greater than zero")
    private double unitCost;

    @NotBlank(message = "Location bin is required")
    private String locationBin;

    public SparePartRequest() {
    }

    public SparePartRequest(String partNumber, String name, int stockQuantity, int reorderLevel, double unitCost, String locationBin) {
        this.partNumber = partNumber;
        this.name = name;
        this.stockQuantity = stockQuantity;
        this.reorderLevel = reorderLevel;
        this.unitCost = unitCost;
        this.locationBin = locationBin;
    }

    public String getPartNumber() {
        return partNumber;
    }

    public void setPartNumber(String partNumber) {
        this.partNumber = partNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public int getReorderLevel() {
        return reorderLevel;
    }

    public void setReorderLevel(int reorderLevel) {
        this.reorderLevel = reorderLevel;
    }

    public double getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(double unitCost) {
        this.unitCost = unitCost;
    }

    public String getLocationBin() {
        return locationBin;
    }

    public void setLocationBin(String locationBin) {
        this.locationBin = locationBin;
    }
}
