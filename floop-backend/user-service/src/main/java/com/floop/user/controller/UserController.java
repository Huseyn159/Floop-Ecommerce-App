package com.floop.user.controller;

import com.floop.user.dto.*;
import com.floop.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    @GetMapping("/me/addresses")
    public ResponseEntity<List<AddressResponse>> getAddresses(
            @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(userService.getAddresses(userId));
    }

    @PostMapping("/me/addresses")
    public ResponseEntity<AddressResponse> addAddress(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody CreateAddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.addAddress(userId, request));
    }

    @PatchMapping("/me/addresses/{addressId}")
    public ResponseEntity<AddressResponse> updateAddress(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID addressId,
            @RequestBody UpdateAddressRequest request) {
        return ResponseEntity.ok(userService.updateAddress(userId, addressId, request));
    }

    @DeleteMapping("/me/addresses/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID addressId) {
        userService.deleteAddress(userId, addressId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/me/addresses/{addressId}/default")
    public ResponseEntity<Void> setDefaultAddress(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID addressId) {
        userService.setDefaultAddress(userId, addressId);
        return ResponseEntity.ok().build();
    }
}