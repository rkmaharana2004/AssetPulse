package com.rkmaharana.assetpulse.service;

import com.rkmaharana.assetpulse.dto.PartUsageRequest;
import com.rkmaharana.assetpulse.dto.TicketCloseRequest;
import com.rkmaharana.assetpulse.dto.TicketCreateRequest;
import com.rkmaharana.assetpulse.exception.InsufficientStockException;
import com.rkmaharana.assetpulse.exception.ResourceNotFoundException;
import com.rkmaharana.assetpulse.model.Asset;
import com.rkmaharana.assetpulse.model.AssetStatus;
import com.rkmaharana.assetpulse.model.MaintenanceTicket;
import com.rkmaharana.assetpulse.model.SparePart;
import com.rkmaharana.assetpulse.model.TicketPriority;
import com.rkmaharana.assetpulse.model.TicketStatus;
import com.rkmaharana.assetpulse.model.TicketType;
import com.rkmaharana.assetpulse.repository.AssetRepository;
import com.rkmaharana.assetpulse.repository.MaintenanceTicketRepository;
import com.rkmaharana.assetpulse.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceServiceTest {

    @Mock
    private MaintenanceTicketRepository ticketRepository;

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private SparePartRepository sparePartRepository;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private MaintenanceService maintenanceService;

    private Asset sampleAsset;
    private SparePart sampleBearing;
    private SparePart sampleSeal;
    private MaintenanceTicket sampleTicket;

    @BeforeEach
    void setUp() {
        sampleAsset = new Asset();
        sampleAsset.setId("asset-001");
        sampleAsset.setAssetCode("CNC-MILL-02");
        sampleAsset.setName("5-Axis CNC Milling Machine");
        sampleAsset.setDepartment("Precision Machining");
        sampleAsset.setStatus(AssetStatus.OPERATIONAL);
        sampleAsset.setServiceIntervalDays(90);
        sampleAsset.setLastServicedDate(LocalDate.now().minusDays(30));

        sampleBearing = new SparePart();
        sampleBearing.setId("part-001");
        sampleBearing.setPartNumber("BRG-7208-AC");
        sampleBearing.setName("Angular Contact Spindle Bearing");
        sampleBearing.setStockQuantity(10);
        sampleBearing.setReorderLevel(3);
        sampleBearing.setUnitCost(3450.0);

        sampleSeal = new SparePart();
        sampleSeal.setId("part-002");
        sampleSeal.setPartNumber("HYD-SEAL-90");
        sampleSeal.setName("High-Pressure Seal");
        sampleSeal.setStockQuantity(2); // low stock
        sampleSeal.setReorderLevel(5);
        sampleSeal.setUnitCost(1200.0);

        sampleTicket = new MaintenanceTicket();
        sampleTicket.setId("ticket-001");
        sampleTicket.setTicketCode("MNT-2026-031");
        sampleTicket.setAssetId("asset-001");
        sampleTicket.setAssetCode("CNC-MILL-02");
        sampleTicket.setType(TicketType.BREAKDOWN);
        sampleTicket.setStatus(TicketStatus.OPEN);
    }

    @Test
    @DisplayName("Opening a BREAKDOWN ticket automatically transitions asset to UNDER_MAINTENANCE")
    void testCreateTicket_BreakdownType_TransitionsAssetToUnderMaintenance() {
        when(assetRepository.findById("asset-001")).thenReturn(Optional.of(sampleAsset));
        when(ticketRepository.count()).thenReturn(1L);
        when(ticketRepository.existsByTicketCode(anyString())).thenReturn(false);
        when(ticketRepository.save(any(MaintenanceTicket.class))).thenAnswer(inv -> inv.getArgument(0));

        TicketCreateRequest request = new TicketCreateRequest(
                "asset-001",
                TicketType.BREAKDOWN,
                TicketPriority.HIGH,
                "Spindle excessive vibration"
        );

        MaintenanceTicket created = maintenanceService.createTicket(request, "eng_rupesh");

        assertThat(created).isNotNull();
        assertThat(created.getType()).isEqualTo(TicketType.BREAKDOWN);
        assertThat(created.getOpenedBy()).isEqualTo("eng_rupesh");

        // Verify asset transition
        ArgumentCaptor<Asset> assetCaptor = ArgumentCaptor.forClass(Asset.class);
        verify(assetRepository).save(assetCaptor.capture());
        assertThat(assetCaptor.getValue().getStatus()).isEqualTo(AssetStatus.UNDER_MAINTENANCE);
    }

    @Test
    @DisplayName("Opening a PREVENTATIVE ticket preserves operational status")
    void testCreateTicket_PreventativeType_PreservesOperationalStatus() {
        when(assetRepository.findById("asset-001")).thenReturn(Optional.of(sampleAsset));
        when(ticketRepository.count()).thenReturn(1L);
        when(ticketRepository.existsByTicketCode(anyString())).thenReturn(false);
        when(ticketRepository.save(any(MaintenanceTicket.class))).thenAnswer(inv -> inv.getArgument(0));

        TicketCreateRequest request = new TicketCreateRequest(
                "asset-001",
                TicketType.PREVENTATIVE,
                TicketPriority.LOW,
                "Quarterly routine spindle inspection"
        );

        MaintenanceTicket created = maintenanceService.createTicket(request, "eng_rupesh");

        assertThat(created).isNotNull();
        assertThat(created.getType()).isEqualTo(TicketType.PREVENTATIVE);
        // Verify asset was NOT saved with UNDER_MAINTENANCE
        verify(assetRepository, never()).save(any(Asset.class));
    }

    @Test
    @DisplayName("Closing ticket deducts stock atomically, restores asset to OPERATIONAL, and records downtime")
    void testCloseTicket_Success_DeductsStockAndRestoresAssetStatus() {
        when(ticketRepository.findById("ticket-001")).thenReturn(Optional.of(sampleTicket));
        when(sparePartRepository.findById("part-001")).thenReturn(Optional.of(sampleBearing));
        when(assetRepository.findById("asset-001")).thenReturn(Optional.of(sampleAsset));
        when(ticketRepository.save(any(MaintenanceTicket.class))).thenAnswer(inv -> inv.getArgument(0));

        TicketCloseRequest closeRequest = new TicketCloseRequest(
                "Replaced spindle bearing assembly and aligned spindle",
                185,
                List.of(new PartUsageRequest("part-001", 2))
        );

        MaintenanceTicket closed = maintenanceService.closeTicket("ticket-001", closeRequest);

        // Verify ticket state
        assertThat(closed.getStatus()).isEqualTo(TicketStatus.CLOSED);
        assertThat(closed.getDowntimeMinutes()).isEqualTo(185);
        assertThat(closed.getResolutionNotes()).isEqualTo("Replaced spindle bearing assembly and aligned spindle");
        assertThat(closed.getClosedAt()).isNotNull();
        assertThat(closed.getPartsUsed()).hasSize(1);
        assertThat(closed.getPartsUsed().get(0).getQuantityUsed()).isEqualTo(2);
        assertThat(closed.getPartsUsed().get(0).getUnitCostAtTime()).isEqualTo(3450.0);

        // Verify atomic spare-part stock deduction: 10 - 2 = 8
        ArgumentCaptor<SparePart> partCaptor = ArgumentCaptor.forClass(SparePart.class);
        verify(sparePartRepository).save(partCaptor.capture());
        assertThat(partCaptor.getValue().getStockQuantity()).isEqualTo(8);

        // Verify asset restored to OPERATIONAL and service dates updated
        ArgumentCaptor<Asset> assetCaptor = ArgumentCaptor.forClass(Asset.class);
        verify(assetRepository).save(assetCaptor.capture());
        assertThat(assetCaptor.getValue().getStatus()).isEqualTo(AssetStatus.OPERATIONAL);
        assertThat(assetCaptor.getValue().getLastServicedDate()).isEqualTo(LocalDate.now());
        assertThat(assetCaptor.getValue().getNextServiceDueDate()).isEqualTo(LocalDate.now().plusDays(90));
    }

    @Test
    @DisplayName("Closing ticket with insufficient stock throws InsufficientStockException and mutates zero inventory")
    void testCloseTicket_InsufficientStock_ThrowsInsufficientStockExceptionAndMutatesNoStock() {
        when(ticketRepository.findById("ticket-001")).thenReturn(Optional.of(sampleTicket));
        when(sparePartRepository.findById("part-001")).thenReturn(Optional.of(sampleBearing)); // stock 10, valid
        when(sparePartRepository.findById("part-002")).thenReturn(Optional.of(sampleSeal));    // stock 2, request 5 -> deficit!

        TicketCloseRequest closeRequest = new TicketCloseRequest(
                "Attempted repair",
                60,
                List.of(
                        new PartUsageRequest("part-001", 2),
                        new PartUsageRequest("part-002", 5) // Exceeds available stock (2)
                )
        );

        assertThatThrownBy(() -> maintenanceService.closeTicket("ticket-001", closeRequest))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Insufficient stock for part 'High-Pressure Seal'")
                .hasMessageContaining("Available: 2, Requested: 5");

        // Verify zero mutation occurred across database
        verify(sparePartRepository, never()).save(any(SparePart.class));
        verify(assetRepository, never()).save(any(Asset.class));
        verify(ticketRepository, never()).save(any(MaintenanceTicket.class));
    }

    @Test
    @DisplayName("Closing an already closed ticket throws IllegalStateException")
    void testCloseTicket_AlreadyClosed_ThrowsIllegalStateException() {
        sampleTicket.setStatus(TicketStatus.CLOSED);
        when(ticketRepository.findById("ticket-001")).thenReturn(Optional.of(sampleTicket));

        TicketCloseRequest closeRequest = new TicketCloseRequest(
                "Duplicate closure attempt",
                30,
                List.of()
        );

        assertThatThrownBy(() -> maintenanceService.closeTicket("ticket-001", closeRequest))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("is already closed");

        verify(sparePartRepository, never()).save(any());
        verify(assetRepository, never()).save(any());
    }

    @Test
    @DisplayName("Closing ticket with non-existent partId throws ResourceNotFoundException")
    void testCloseTicket_PartNotFound_ThrowsResourceNotFoundException() {
        when(ticketRepository.findById("ticket-001")).thenReturn(Optional.of(sampleTicket));
        when(sparePartRepository.findById("invalid-part-id")).thenReturn(Optional.empty());

        TicketCloseRequest closeRequest = new TicketCloseRequest(
                "Notes",
                45,
                List.of(new PartUsageRequest("invalid-part-id", 1))
        );

        assertThatThrownBy(() -> maintenanceService.closeTicket("ticket-001", closeRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Spare part not found");

        verify(sparePartRepository, never()).save(any());
    }
}
