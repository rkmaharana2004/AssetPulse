package com.rkmaharana.assetpulse.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "assets")
public class Asset {

    @Id
    private String id;

    @Indexed(unique = true)
    private String assetCode;

    private String name;

    private String department;

    private String manufacturer;

    private AssetStatus status = AssetStatus.OPERATIONAL;

    private int serviceIntervalDays;

    private LocalDate lastServicedDate;

    private LocalDate nextServiceDueDate;

    private Instant createdAt = Instant.now();

    public Asset() {
    }

    public Asset(String assetCode, String name, String department, String manufacturer, int serviceIntervalDays) {
        this.assetCode = assetCode;
        this.name = name;
        this.department = department;
        this.manufacturer = manufacturer;
        this.serviceIntervalDays = serviceIntervalDays;
        this.status = AssetStatus.OPERATIONAL;
        this.lastServicedDate = LocalDate.now();
        this.nextServiceDueDate = LocalDate.now().plusDays(serviceIntervalDays);
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public AssetStatus getStatus() {
        return status;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
    }

    public int getServiceIntervalDays() {
        return serviceIntervalDays;
    }

    public void setServiceIntervalDays(int serviceIntervalDays) {
        this.serviceIntervalDays = serviceIntervalDays;
    }

    public LocalDate getLastServicedDate() {
        return lastServicedDate;
    }

    public void setLastServicedDate(LocalDate lastServicedDate) {
        this.lastServicedDate = lastServicedDate;
    }

    public LocalDate getNextServiceDueDate() {
        return nextServiceDueDate;
    }

    public void setNextServiceDueDate(LocalDate nextServiceDueDate) {
        this.nextServiceDueDate = nextServiceDueDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
