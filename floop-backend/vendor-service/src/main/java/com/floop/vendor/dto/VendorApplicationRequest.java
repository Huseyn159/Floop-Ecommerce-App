package com.floop.vendor.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VendorApplicationRequest {

    @NotBlank
    @Size(min = 2, max = 100)
    private String storeName;

    @NotBlank
    @Size(max = 255)
    private String storeDescription;

    @NotBlank
    @Email
    private String businessEmail;

    @NotBlank
    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Invalid phone number")
    private String businessPhone;

    @NotBlank
    private String businessAddress;

    @NotBlank
    @Size(min = 2, max = 50)
    private String storeSlug;
}