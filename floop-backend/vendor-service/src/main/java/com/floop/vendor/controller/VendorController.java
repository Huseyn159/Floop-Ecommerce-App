package com.floop.vendor.controller;

import com.floop.vendor.dto.AdminVendorActionRequest;
import com.floop.vendor.dto.UpdateVendorRequest;
import com.floop.vendor.dto.VendorApplicationRequest;
import com.floop.vendor.dto.VendorResponse;
import com.floop.vendor.service.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;


    @PostMapping("/apply")
    public ResponseEntity<VendorResponse> apply(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody VendorApplicationRequest vendorApplicationRequest
            ){
        return ResponseEntity.status(HttpStatus.CREATED).body(vendorService.apply(userId,vendorApplicationRequest));
    }

    @GetMapping("/me")
    public ResponseEntity<VendorResponse> getMyStore(
            @RequestHeader("X-User-Id") UUID userId
    ){
        return ResponseEntity.ok(vendorService.getMyStore(userId));
    }

    @GetMapping("{slug}")
    public ResponseEntity<VendorResponse> getBySlug(
            @PathVariable String slug
    ){
        return ResponseEntity.ok(vendorService.getBySlug(slug));
    };

    @PatchMapping("/me")
    public ResponseEntity<VendorResponse> updateStore(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody UpdateVendorRequest request
    ){
        return ResponseEntity.ok(vendorService.updateStore(userId,request));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deactivateMyStore(
            @RequestHeader("X-User-Id") UUID userId) {
        vendorService.deactivateMyStore(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/reactivate")
    public ResponseEntity<VendorResponse> reactivateMyStore(
            @RequestHeader("X-User-Id") UUID userId
    ){
        return ResponseEntity.ok(vendorService.reactivateMyStore(userId));    }



    //===================ADMIN METHODS=====================//

    @GetMapping("/admin/pending")
    public ResponseEntity<List<VendorResponse>> getPendingVendors(
            @RequestHeader("X-User-Id") UUID adminId
    ){
        return ResponseEntity.ok(vendorService.getPendingVendors());
    };

    @PutMapping("/admin/{vendorId}/review")
    public ResponseEntity<VendorResponse> reviewVendor(
            @PathVariable UUID vendorId,
            @RequestHeader("X-User-Id") UUID adminId,
            @Valid @RequestBody AdminVendorActionRequest request
    ){
        return ResponseEntity.ok(vendorService.reviewVendor(vendorId,request));
    }

    @PutMapping("/admin/{vendorId}/suspend")
    public ResponseEntity<VendorResponse> suspendVendor(
            @PathVariable UUID vendorId,
            @RequestHeader("X-User-Id") UUID adminId

    ){
        return ResponseEntity.ok(vendorService.suspendVendor(vendorId));
    }



}
