package com.rkmaharana.assetpulse.repository;

import com.rkmaharana.assetpulse.model.MaintenanceTicket;
import com.rkmaharana.assetpulse.model.TicketStatus;
import com.rkmaharana.assetpulse.model.TicketType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceTicketRepository extends MongoRepository<MaintenanceTicket, String> {
    Optional<MaintenanceTicket> findByTicketCode(String ticketCode);
    boolean existsByTicketCode(String ticketCode);
    List<MaintenanceTicket> findByAssetId(String assetId);
    List<MaintenanceTicket> findByStatus(TicketStatus status);
    List<MaintenanceTicket> findByType(TicketType type);
}
