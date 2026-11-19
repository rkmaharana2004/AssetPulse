package com.rkmaharana.assetpulse.controller;

import com.rkmaharana.assetpulse.dto.DowntimeSummaryDTO;
import com.rkmaharana.assetpulse.dto.TicketCloseRequest;
import com.rkmaharana.assetpulse.dto.TicketCreateRequest;
import com.rkmaharana.assetpulse.model.MaintenanceTicket;
import com.rkmaharana.assetpulse.model.TicketStatus;
import com.rkmaharana.assetpulse.model.TicketType;
import com.rkmaharana.assetpulse.model.User;
import com.rkmaharana.assetpulse.service.MaintenanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/v1/tickets")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceTicket>> getTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketType type,
            @RequestParam(required = false) String assetId
    ) {
        List<MaintenanceTicket> tickets = maintenanceService.getTickets(status, type, assetId);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceTicket> getTicketById(@PathVariable String id) {
        return ResponseEntity.ok(maintenanceService.getTicketById(id));
    }

    @PostMapping
    public ResponseEntity<MaintenanceTicket> openTicket(
            @Valid @RequestBody TicketCreateRequest request,
            @AuthenticationPrincipal User user
    ) {
        String openedBy = user != null ? user.getUsername() : "system";
        MaintenanceTicket ticket = maintenanceService.createTicket(request, openedBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<MaintenanceTicket> closeTicket(
            @PathVariable String id,
            @Valid @RequestBody TicketCloseRequest request
    ) {
        MaintenanceTicket closedTicket = maintenanceService.closeTicket(id, request);
        return ResponseEntity.ok(closedTicket);
    }

    @GetMapping("/analytics/downtime")
    public ResponseEntity<List<DowntimeSummaryDTO>> getDowntimeAnalytics() {
        List<DowntimeSummaryDTO> analytics = maintenanceService.getDowntimeAnalytics();
        return ResponseEntity.ok(analytics);
    }
}
