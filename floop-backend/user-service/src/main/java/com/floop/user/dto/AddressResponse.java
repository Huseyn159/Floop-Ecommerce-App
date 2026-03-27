package com.floop.user.dto;


import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class AddressResponse {
    private UUID id;
    private String title;
    private String fullName;
    private String phoneNumber;
    private String country;
    private String city;
    private String district;
    private String addressLine;
    private String zipCode;
    private boolean isDefault;
}