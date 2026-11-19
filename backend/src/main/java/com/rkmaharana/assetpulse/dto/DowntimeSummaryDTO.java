package com.rkmaharana.assetpulse.dto;

public class DowntimeSummaryDTO {

    private String assetId;
    private String assetCode;
    private String assetName;
    private long totalDowntimeMinutes;
    private double totalDowntimeHours;
    private long breakdownCount;
    private double totalPartsCost;

    public DowntimeSummaryDTO() {
    }

    public DowntimeSummaryDTO(String assetId, String assetCode, String assetName, long totalDowntimeMinutes, double totalDowntimeHours, long breakdownCount, double totalPartsCost) {
        this.assetId = assetId;
        this.assetCode = assetCode;
        this.assetName = assetName;
        this.totalDowntimeMinutes = totalDowntimeMinutes;
        this.totalDowntimeHours = totalDowntimeHours;
        this.breakdownCount = breakdownCount;
        this.totalPartsCost = totalPartsCost;
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

    public String getAssetName() {
        return assetName;
    }

    public void setAssetName(String assetName) {
        this.assetName = assetName;
    }

    public long getTotalDowntimeMinutes() {
        return totalDowntimeMinutes;
    }

    public void setTotalDowntimeMinutes(long totalDowntimeMinutes) {
        this.totalDowntimeMinutes = totalDowntimeMinutes;
    }

    public double getTotalDowntimeHours() {
        return totalDowntimeHours;
    }

    public void setTotalDowntimeHours(double totalDowntimeHours) {
        this.totalDowntimeHours = totalDowntimeHours;
    }

    public long getBreakdownCount() {
        return breakdownCount;
    }

    public void setBreakdownCount(long breakdownCount) {
        this.breakdownCount = breakdownCount;
    }

    public double getTotalPartsCost() {
        return totalPartsCost;
    }

    public void setTotalPartsCost(double totalPartsCost) {
        this.totalPartsCost = totalPartsCost;
    }
}
