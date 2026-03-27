package com.floop.vendor.service.impl;

import com.floop.vendor.dto.AdminVendorActionRequest;
import com.floop.vendor.dto.UpdateVendorRequest;
import com.floop.vendor.dto.VendorApplicationRequest;
import com.floop.vendor.dto.VendorResponse;
import com.floop.vendor.dto.mapper.VendorMapper;
import com.floop.vendor.entity.Vendor;
import com.floop.vendor.entity.VendorStatus;
import com.floop.vendor.event.VendorApprovedEvent;
import com.floop.vendor.event.producer.VendorEventProducer;
import com.floop.vendor.exception.*;
import com.floop.vendor.repository.VendorRepository;
import com.floop.vendor.service.VendorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorEventProducer vendorEventProducer;
    private final VendorRepository vendorRepository;
    private final VendorMapper vendorMapper;

    @Override
    @Transactional
    public VendorResponse apply(UUID userId, VendorApplicationRequest request) {

        if (vendorRepository.existsById(userId)) {
            throw new VendorAlreadyExistsException();
        }

        if (vendorRepository.existsByStoreSlug(request.getStoreSlug())) {
            throw new StoreSlugAlreadyTakenException(request.getStoreSlug());
        }

        if (vendorRepository.existsByBusinessEmail(request.getBusinessEmail())) {
            throw new VendorAlreadyExistsException();
        }

        Vendor vendor = Vendor.builder()
                .userId(userId)
                .storeName(request.getStoreName())
                .storeSlug(request.getStoreSlug())
                .storeDescription(request.getStoreDescription())
                .businessEmail(request.getBusinessEmail())
                .businessPhone(request.getBusinessPhone())
                .businessAddress(request.getBusinessAddress())
                .build();

        Vendor saved = vendorRepository.save(vendor);
        log.info("Vendor application submitted: userId={}, storeName={}",
                userId, request.getStoreName());

        return vendorMapper.toResponse(saved);
    }

    @Override
    public VendorResponse getMyStore(UUID userId) {
        Vendor vendor = findVendorOrThrow(userId);
        return vendorMapper.toResponse(vendor);
    }

    @Override
    public VendorResponse getBySlug(String slug) {
        Vendor vendor = vendorRepository.findByStoreSlug(slug)
                .orElseThrow(() -> new VendorNotFoundException(null));

        if (vendor.getStatus() != VendorStatus.APPROVED) {
            throw new VendorNotApprovedException();
        }

        return vendorMapper.toResponse(vendor);
    }

    @Override
    @Transactional
    public VendorResponse updateStore(UUID userId, UpdateVendorRequest request) {
        Vendor vendor = findVendorOrThrow(userId);

        if (vendor.getStatus() != VendorStatus.APPROVED) {
            throw new VendorNotApprovedException();
        }

        if (request.getStoreName() != null) vendor.setStoreName(request.getStoreName());
        if (request.getStoreDescription() != null) vendor.setStoreDescription(request.getStoreDescription());
        if (request.getBusinessEmail() != null) vendor.setBusinessEmail(request.getBusinessEmail());
        if (request.getBusinessPhone() != null) vendor.setBusinessPhone(request.getBusinessPhone());
        if (request.getBusinessAddress() != null) vendor.setBusinessAddress(request.getBusinessAddress());

        return vendorMapper.toResponse(vendorRepository.save(vendor));
    }

    @Override
    @Transactional
    public void deactivateMyStore(UUID userId) {
        Vendor vendor = findVendorOrThrow(userId);

        if (vendor.getStatus() != VendorStatus.APPROVED) {
            throw new VendorNotApprovedException();
        }

        vendor.setStatus(VendorStatus.DEACTIVATED);
        vendorRepository.save(vendor);
        log.info("Vendor deactivated by owner: userId={}", userId);
    }

    @Override
    @Transactional
    public VendorResponse reactivateMyStore(UUID userId) {
        Vendor vendor = findVendorOrThrow(userId);

        if (vendor.getStatus() != VendorStatus.DEACTIVATED) {
            throw new InvalidVendorStatusException(
                    "Only DEACTIVATED stores can be reactivated");
        }

        vendor.setStatus(VendorStatus.APPROVED);
        vendorRepository.save(vendor);
        log.info("Vendor reactivated: userId={}", userId);

        return vendorMapper.toResponse(vendor);
    }

    @Override
    public List<VendorResponse> getPendingVendors() {
        return vendorRepository.findByStatus(VendorStatus.PENDING)
                .stream()
                .map(vendorMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public VendorResponse reviewVendor(UUID vendorId, AdminVendorActionRequest request) {
        Vendor vendor = findVendorOrThrow(vendorId);

        if (vendor.getStatus() != VendorStatus.PENDING) {
            throw new InvalidVendorStatusException(
                    "Only PENDING vendors can be reviewed");
        }

        if (request.getStatus() != VendorStatus.APPROVED &&
                request.getStatus() != VendorStatus.REJECTED) {
            throw new InvalidVendorStatusException(
                    "Status must be APPROVED or REJECTED");
        }

        if (request.getStatus() == VendorStatus.REJECTED &&
                (request.getRejectionReason() == null ||
                        request.getRejectionReason().isBlank())) {
            throw new InvalidVendorStatusException(
                    "Rejection reason is required");
        }

        vendor.setStatus(request.getStatus());
        vendor.setRejectionReason(request.getRejectionReason());

        if (request.getStatus() == VendorStatus.APPROVED) {

            vendor.setApprovedAt(LocalDateTime.now());
            vendorEventProducer.sendVendorApprovedEvent(
                    VendorApprovedEvent.builder()
                            .userId(vendor.getUserId())
                            .build()
            );
            log.info("Vendor approved: vendorId={}", vendorId);
        } else {
            log.info("Vendor rejected: vendorId={}, reason={}",
                    vendorId, request.getRejectionReason());
        }

        return vendorMapper.toResponse(vendorRepository.save(vendor));
    }

    @Override
    @Transactional
    public VendorResponse suspendVendor(UUID vendorId) {
        Vendor vendor = findVendorOrThrow(vendorId);

        if (vendor.getStatus() == VendorStatus.SUSPENDED) {
            throw new InvalidVendorStatusException("Vendor is already suspended");
        }

        vendor.setStatus(VendorStatus.SUSPENDED);
        log.info("Vendor suspended: vendorId={}", vendorId);

        return vendorMapper.toResponse(vendorRepository.save(vendor));
    }


    private Vendor findVendorOrThrow(UUID userId) {
        return vendorRepository.findById(userId)
                .orElseThrow(() -> new VendorNotFoundException(userId));
    }
}