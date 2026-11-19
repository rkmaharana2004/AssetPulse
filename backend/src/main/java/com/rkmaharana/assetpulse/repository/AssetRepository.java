package com.rkmaharana.assetpulse.repository;

import com.rkmaharana.assetpulse.model.Asset;
import com.rkmaharana.assetpulse.model.AssetStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends MongoRepository<Asset, String> {
    Optional<Asset> findByAssetCode(String assetCode);
    boolean existsByAssetCode(String assetCode);
    List<Asset> findByDepartment(String department);
    List<Asset> findByStatus(AssetStatus status);
    List<Asset> findByDepartmentAndStatus(String department, AssetStatus status);
}
