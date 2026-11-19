package com.rkmaharana.assetpulse.model;

public class PartUsage {

    private String partId;
    private String partNumber;
    private int quantityUsed;
    private double unitCostAtTime;

    public PartUsage() {
    }

    public PartUsage(String partId, String partNumber, int quantityUsed, double unitCostAtTime) {
        this.partId = partId;
        this.partNumber = partNumber;
        this.quantityUsed = quantityUsed;
        this.unitCostAtTime = unitCostAtTime;
    }

    public String getPartId() {
        return partId;
    }

    public void setPartId(String partId) {
        this.partId = partId;
    }

    public String getPartNumber() {
        return partNumber;
    }

    public void setPartNumber(String partNumber) {
        this.partNumber = partNumber;
    }

    public int getQuantityUsed() {
        return quantityUsed;
    }

    public void setQuantityUsed(int quantityUsed) {
        this.quantityUsed = quantityUsed;
    }

    public double getUnitCostAtTime() {
        return unitCostAtTime;
    }

    public void setUnitCostAtTime(double unitCostAtTime) {
        this.unitCostAtTime = unitCostAtTime;
    }
}
