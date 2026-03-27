package com.floop.vendor.exception;

public class InvalidVendorStatusException extends RuntimeException {
    public InvalidVendorStatusException(String message) {
        super(message);
    }
}
