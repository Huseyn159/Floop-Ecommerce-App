package com.floop.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateAddressRequest {

    @NotBlank
    @Size(max = 50)
    private String title;

    @NotBlank
    @Size(min = 2,max = 100)
    private String fullName;

    @NotBlank
    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Invalid phone number format")
    private String phoneNumber;

    @NotBlank
    @Size(max=100)
    private String country;

    @NotBlank
    @Size(max=100)
    private String city;

    @NotBlank
    @Size(max=100)
    private String district;

    @NotBlank
    @Size(max=255)
    private String addressLine;

    @Pattern(
            regexp = "^[A-Z0-9]{3,10}$",
            message = "Invalid zip code format"
    )
    private String zipCode;
    private boolean isDefault;
}