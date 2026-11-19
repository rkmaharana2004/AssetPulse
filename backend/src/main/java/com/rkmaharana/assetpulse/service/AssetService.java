package com.rkmaharana.assetpulse.service;

import com.rkmaharana.assetpulse.dto.AssetRequest;
import com.rkmaharana.assetpulse.exception.ResourceNotFoundException;
import com.rkmaharana.assetpulse.model.Asset;
import com.rkmaharana.assetpulse.model.AssetStatus;
import com.rkmaharana.assetpulse.repository.AssetRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class AssetService {

    private final AssetRepository assetRepository;

    public AssetService(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    public Asset createAsset(AssetRequest request) {
        if (assetRepository.existsByAssetCode(request.getAssetCode())) {
            throw new IllegalArgumentException("Asset code '" + request.getAssetCode() + "' is already registered");
        }

        Asset asset = new Asset();
        asset.setAssetCode(request.getAssetCode());
        asset.setName(request.getName());
        asset.setDepartment(request.getDepartment());
        asset.setManufacturer(request.getManufacturer());
        asset.setServiceIntervalDays(request.getServiceIntervalDays());

        AssetStatus initialStatus = request.getStatus() != null ? request.getStatus() : AssetStatus.OPERATIONAL;
        asset.setStatus(initialStatus);

        LocalDate lastServiced = request.getLastServicedDate() != null ? request.getLastServicedDate() : LocalDate.now();
        asset.setLastServicedDate(lastServiced);
        asset.setNextServiceDueDate(lastServiced.plusDays(request.getServiceIntervalDays()));
        asset.setCreatedAt(Instant.now());

        return assetRepository.save(asset);
    }

    public List<Asset> getAssets(String department, AssetStatus status) {
        boolean hasDept = department != null && !department.trim().isEmpty();
        boolean hasStatus = status != null;

        if (hasDept && hasStatus) {
            return assetRepository.findByDepartmentAndStatus(department.trim(), status);
        } else if (hasDept) {
            return assetRepository.findByDepartment(department.trim());
        } else if (hasStatus) {
            return assetRepository.findByStatus(status);
        } else {
            return assetRepository.findAll();
        }
    }

    public Asset getAssetById(String id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));
    }

    public Asset getAssetByCode(String assetCode) {
        return assetRepository.findByAssetCode(assetCode)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with code: " + assetCode));
    }
}
