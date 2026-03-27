package com.floop.user.dto;



import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAddressRequest {


    @Size(max = 50)
    private String title;

    @Size(max = 50)
    private String fullName;

    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Invalid phone number format")
    private String phoneNumber;

    @Size(max=100)
    private String country;

    @Size(max=100)
    private String city;

    @Size(max=100)
    private String district;

    @Size(max=255)
    private String addressLine;

    @Pattern(
            regexp = "^[A-Z0-9]{3,10}$",
            message = "Invalid zip code format"
    )
    private String zipCode;
    private Boolean isDefault;
}