package com.floop.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @Size(min = 2, max = 50)
    private String firstName;

    @Size(min = 2, max = 50)
    private String lastName;

    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Invalid phone number format")
    private String phoneNumber;

    @Size(max = 500)
    private String bio;


    private Boolean emailNotifications;
    private Boolean pushNotifications;

    @Pattern(regexp = "^(az|en|tr)$", message = "Language must be az, en or tr")
    private String language;

    @Pattern(regexp = "^(AZN|USD|EUR)$", message = "Currency must be AZN, USD or EUR")
    private String currency;
}