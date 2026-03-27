package com.floop.vendor.service;

import com.floop.vendor.dto.AdminVendorActionRequest;
import com.floop.vendor.dto.UpdateVendorRequest;
import com.floop.vendor.dto.VendorApplicationRequest;
import com.floop.vendor.dto.VendorResponse;
import java.util.List;
import java.util.UUID;

public interface VendorService {

    VendorResponse apply(UUID userId, VendorApplicationRequest request);

    VendorResponse getMyStore(UUID userId);

    VendorResponse getBySlug(String slug);

    VendorResponse updateStore(UUID userId, UpdateVendorRequest request);

    void deactivateMyStore(UUID userId);

    VendorResponse reactivateMyStore(UUID userId);

    // Admin — bütün müraciətlər
    List<VendorResponse> getPendingVendors();

    // Admin — təsdiq/rədd
    VendorResponse reviewVendor(UUID vendorId, AdminVendorActionRequest request);

    // Admin — vendor-u blokla
    VendorResponse suspendVendor(UUID vendorId);


}