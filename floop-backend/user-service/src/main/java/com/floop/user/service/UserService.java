package com.floop.user.service;

import com.floop.user.dto.*;
import java.util.List;
import java.util.UUID;

public interface UserService {
    UserProfileResponse getProfile(UUID userId);
    UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request);
    List<AddressResponse> getAddresses(UUID userId);
    AddressResponse addAddress(UUID userId, CreateAddressRequest request);
    AddressResponse updateAddress(UUID userId, UUID addressId, UpdateAddressRequest request);
    void deleteAddress(UUID userId, UUID addressId);
    void setDefaultAddress(UUID userId, UUID addressId);
}