package com.rkmaharana.assetpulse.dto;

import com.rkmaharana.assetpulse.model.AssetStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public class AssetRequest {

    @NotBlank(message = "Asset code is required")
    private String assetCode;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Manufacturer is required")
    private String manufacturer;

    @Positive(message = "Service interval days must be positive")
    private int serviceIntervalDays;

    private AssetStatus status;

    private LocalDate lastServicedDate;

    public AssetRequest() {
    }

    public AssetRequest(String assetCode, String name, String department, String manufacturer, int serviceIntervalDays) {
        this.assetCode = assetCode;
        this.name = name;
        this.department = department;
        this.manufacturer = manufacturer;
        this.serviceIntervalDays = serviceIntervalDays;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public void setAssetCode(String assetCode) {
        this.assetCode = assetCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public int getServiceIntervalDays() {
        return serviceIntervalDays;
    }

    public void setServiceIntervalDays(int serviceIntervalDays) {
        this.serviceIntervalDays = serviceIntervalDays;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
    }

    public LocalDate getLastServicedDate() {
        return lastServicedDate;
    }

    public void setLastServicedDate(LocalDate lastServicedDate) {
        this.lastServicedDate = lastServicedDate;
    }
}
