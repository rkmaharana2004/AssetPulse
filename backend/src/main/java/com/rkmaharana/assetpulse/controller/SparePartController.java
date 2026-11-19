package com.rkmaharana.assetpulse.controller;

import com.rkmaharana.assetpulse.dto.RestockRequest;
import com.rkmaharana.assetpulse.dto.SparePartRequest;
import com.rkmaharana.assetpulse.model.SparePart;
import com.rkmaharana.assetpulse.service.SparePartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parts")
public class SparePartController {

    private final SparePartService sparePartService;

    public SparePartController(SparePartService sparePartService) {
        this.sparePartService = sparePartService;
    }

    @GetMapping
    public ResponseEntity<List<SparePart>> getAllParts() {
        return ResponseEntity.ok(sparePartService.getAllParts());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<SparePart>> getLowStockParts() {
        return ResponseEntity.ok(sparePartService.getLowStockParts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SparePart> getPartById(@PathVariable String id) {
        return ResponseEntity.ok(sparePartService.getPartById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SparePart> createPart(@Valid @RequestBody SparePartRequest request) {
        SparePart created = sparePartService.createSparePart(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/restock")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<SparePart> restockPart(
            @PathVariable String id,
            @RequestBody(required = false) RestockRequest restockRequest,
            @RequestParam(required = false) Integer quantity
    ) {
        int amountToRestock = 0;
        if (restockRequest != null && restockRequest.getQuantity() > 0) {
            amountToRestock = restockRequest.getQuantity();
        } else if (quantity != null && quantity > 0) {
            amountToRestock = quantity;
        } else {
            throw new IllegalArgumentException("Positive restock quantity must be provided in request body or query parameter");
        }

        SparePart updated = sparePartService.restockPart(id, amountToRestock);
        return ResponseEntity.ok(updated);
    }
}
