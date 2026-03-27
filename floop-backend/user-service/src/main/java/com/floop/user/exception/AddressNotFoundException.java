package com.floop.user.exception;


import java.util.UUID;

public class AddressNotFoundException extends RuntimeException {
    public AddressNotFoundException(UUID addressId) {
        super("Address not found with id: " + addressId);
    }
}