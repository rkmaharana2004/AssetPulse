package com.rkmaharana.assetpulse.service;

import com.rkmaharana.assetpulse.dto.SparePartRequest;
import com.rkmaharana.assetpulse.exception.ResourceNotFoundException;
import com.rkmaharana.assetpulse.model.SparePart;
import com.rkmaharana.assetpulse.repository.SparePartRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SparePartService {

    private final SparePartRepository sparePartRepository;

    public SparePartService(SparePartRepository sparePartRepository) {
        this.sparePartRepository = sparePartRepository;
    }

    public SparePart createSparePart(SparePartRequest request) {
        if (sparePartRepository.existsByPartNumber(request.getPartNumber())) {
            throw new IllegalArgumentException("Spare part with number '" + request.getPartNumber() + "' already exists");
        }

        SparePart part = new SparePart();
        part.setPartNumber(request.getPartNumber());
        part.setName(request.getName());
        part.setStockQuantity(request.getStockQuantity());
        part.setReorderLevel(request.getReorderLevel());
        part.setUnitCost(request.getUnitCost());
        part.setLocationBin(request.getLocationBin());

        return sparePartRepository.save(part);
    }

    public List<SparePart> getAllParts() {
        return sparePartRepository.findAll();
    }

    public SparePart getPartById(String id) {
        return sparePartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Spare part not found with id: " + id));
    }

    public List<SparePart> getLowStockParts() {
        // Leverages MongoDB $expr { $lte: [ '$stockQuantity', '$reorderLevel' ] }
        List<SparePart> lowStock = sparePartRepository.findLowStockParts();
        if (lowStock == null || lowStock.isEmpty()) {
            // Fallback in memory stream filter
            return sparePartRepository.findAll().stream()
                    .filter(p -> p.getStockQuantity() <= p.getReorderLevel())
                    .toList();
        }
        return lowStock;
    }

    public SparePart restockPart(String id, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Restock quantity must be greater than zero");
        }
        SparePart part = getPartById(id);
        part.setStockQuantity(part.getStockQuantity() + quantity);
        return sparePartRepository.save(part);
    }
}
