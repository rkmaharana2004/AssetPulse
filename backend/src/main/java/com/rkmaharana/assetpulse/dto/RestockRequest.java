package com.rkmaharana.assetpulse.dto;

import jakarta.validation.constraints.Positive;

public class RestockRequest {

    @Positive(message = "Restock quantity must be positive")
    private int quantity;

    public RestockRequest() {
    }

    public RestockRequest(int quantity) {
        this.quantity = quantity;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
