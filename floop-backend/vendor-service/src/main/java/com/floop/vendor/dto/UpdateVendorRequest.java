package com.floop.vendor.dto;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateVendorRequest {

    @Size(min = 2, max = 100)
    private String storeName;

    @Size(max = 255)
    private String storeDescription;

    @Email
    private String businessEmail;

    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Invalid phone number")
    private String businessPhone;

    private String businessAddress;
}