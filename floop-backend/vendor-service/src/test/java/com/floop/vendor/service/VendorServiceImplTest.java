package com.floop.vendor.service;


import com.floop.vendor.dto.AdminVendorActionRequest;
import com.floop.vendor.dto.VendorApplicationRequest;
import com.floop.vendor.dto.VendorResponse;
import com.floop.vendor.dto.mapper.VendorMapper;
import com.floop.vendor.entity.Vendor;
import com.floop.vendor.entity.VendorStatus;
import com.floop.vendor.event.producer.VendorEventProducer;
import com.floop.vendor.exception.InvalidVendorStatusException;
import com.floop.vendor.exception.StoreSlugAlreadyTakenException;
import com.floop.vendor.exception.VendorAlreadyExistsException;
import com.floop.vendor.repository.VendorRepository;
import com.floop.vendor.service.impl.VendorServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VendorServiceImplTest {

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private VendorMapper vendorMapper;

    @Mock
    private VendorEventProducer vendorEventProducer;

    @InjectMocks
    private VendorServiceImpl vendorService;


    private Vendor testVendor;
    private VendorApplicationRequest testRequest;
    private VendorResponse testResponse;
    private UUID testUserId;


    @BeforeEach void setUp() {
        testUserId = UUID.randomUUID();

        testVendor = Vendor.builder()
                .userId(testUserId)
                .storeName("Test Mağaza")
                .storeSlug("test-magaza")
                .storeDescription("Test")
                .businessEmail("vendor@gmail.com")
                .businessPhone("+994501234567")
                .businessAddress("Bakı")
                .status(VendorStatus.PENDING)
                .rating(0.0)
                .totalSales(0)
                .totalProducts(0)
                .balance(0.0)
                .build();

        testRequest = new VendorApplicationRequest();
        testRequest.setStoreName("Test Mağaza");
        testRequest.setStoreSlug("test-magaza");
        testRequest.setStoreDescription("Test");
        testRequest.setBusinessEmail("vendor@gmail.com");
        testRequest.setBusinessPhone("+994501234567");
        testRequest.setBusinessAddress("Bakı");

        testResponse = VendorResponse.builder()
                .userId(testUserId)
                .storeName("Test Mağaza")
                .storeSlug("test-magaza")
                .status(VendorStatus.PENDING)
                .build();
    }


    @Test
    @DisplayName("Apply - ugurlu olduqda vendor yaranir")
    void apply_successful_vendorCreated() {
        when(vendorRepository.existsById(testUserId)).thenReturn(false);
        when(vendorRepository.existsByStoreSlug(anyString())).thenReturn(false);
        when(vendorRepository.existsByBusinessEmail(anyString())).thenReturn(false);
        when(vendorRepository.save(any())).thenReturn(testVendor);
        when(vendorMapper.toResponse(any())).thenReturn(testResponse);

        VendorResponse result = vendorService.apply(testUserId, testRequest);

        assertNotNull(result);
        verify(vendorRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Apply - vendor movcuddursa VendorAlreadyExistsException atilir")
    void apply_ifVendorExists_throwsVendorAlreadyExistsException(){
        when(vendorRepository.existsById(testUserId)).thenReturn(true);

        assertThrows(VendorAlreadyExistsException.class,() ->{
            vendorService.apply(testUserId,testRequest);
        });
    }

    @Test
    @DisplayName("Apply - slug alinisa StoreSlugAlreadyTakenException atilir")
    void apply_ifSlugExists_throwsStoreSlugAlreadyTakenException(){
        when(vendorRepository.existsById(testUserId)).thenReturn(false);
        when(vendorRepository.existsByStoreSlug(testVendor.getStoreSlug())).thenReturn(true);

        assertThrows(StoreSlugAlreadyTakenException.class,() -> {
            vendorService.apply(testUserId,testRequest);
        });
    }

    @Test
    @DisplayName("ReviewVendor - APPROVED olduqda event gonderilir")
    void reviewVendor_whenApprovedSendEvent(){
        AdminVendorActionRequest request = new AdminVendorActionRequest();
        request.setStatus(VendorStatus.APPROVED);

        when(vendorRepository.findById(testUserId))
                .thenReturn(Optional.of(testVendor));

        when(vendorRepository.save(any()))
                .thenReturn(testVendor);

        when(vendorMapper.toResponse(any()))
                .thenReturn(testResponse);

        vendorService.reviewVendor(testUserId, request);

        verify(vendorEventProducer, times(1))
                .sendVendorApprovedEvent(any());
    }


    @Test
    @DisplayName("ReviewVendor - REJECTED olanda səbəb yoxdursa InvalidVendorStatusException atmalidir")
    void reviewVendor_whenRejectedAndHasNoReason_throwsInvalidVendorStatusException(){
        AdminVendorActionRequest request = new AdminVendorActionRequest();
        request.setStatus(VendorStatus.REJECTED);

        when(vendorRepository.findById(testUserId))
                .thenReturn(Optional.of(testVendor));


        assertThrows(InvalidVendorStatusException.class,() ->{
            vendorService.reviewVendor(testUserId,request);
        });
    }

    @Test
    @DisplayName("SuspendVendor - artıq SUSPENDED-dursa InvalidVendorStatusException atilir")
    void suspendVendor_ifAlreadySuspended_throwsInvalidVendorStatusException(){
        AdminVendorActionRequest request = new AdminVendorActionRequest();
        request.setStatus(VendorStatus.SUSPENDED);
        testVendor.setStatus(VendorStatus.SUSPENDED);

        when(vendorRepository.findById(testUserId))
                .thenReturn(Optional.of(testVendor));

        assertThrows(InvalidVendorStatusException.class,() -> {
            vendorService.suspendVendor(testUserId);
        });

    }
}
