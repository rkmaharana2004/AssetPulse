package com.rkmaharana.assetpulse.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "spare_parts")
public class SparePart {

    @Id
    private String id;

    @Indexed(unique = true)
    private String partNumber;

    private String name;

    private int stockQuantity;

    private int reorderLevel;

    private double unitCost;

    private String locationBin;

    public SparePart() {
    }

    public SparePart(String partNumber, String name, int stockQuantity, int reorderLevel, double unitCost, String locationBin) {
        this.partNumber = partNumber;
        this.name = name;
        this.stockQuantity = stockQuantity;
        this.reorderLevel = reorderLevel;
        this.unitCost = unitCost;
        this.locationBin = locationBin;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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
