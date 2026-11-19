package com.rkmaharana.assetpulse.repository;

import com.rkmaharana.assetpulse.model.SparePart;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SparePartRepository extends MongoRepository<SparePart, String> {
    Optional<SparePart> findByPartNumber(String partNumber);
    boolean existsByPartNumber(String partNumber);

    @Query("{ $expr: { $lte: [ '$stockQuantity', '$reorderLevel' ] } }")
    List<SparePart> findLowStockParts();
}
