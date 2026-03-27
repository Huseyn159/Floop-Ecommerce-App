package com.floop.vendor.dto;

import com.floop.vendor.entity.VendorStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminVendorActionRequest {

    @NotNull
    private VendorStatus status; // APPROVED ya REJECTED

    private String rejectionReason; // yalnız REJECTED olanda
}