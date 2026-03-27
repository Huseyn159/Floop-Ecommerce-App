package com.floop.vendor.exception;

public class VendorAlreadyExistsException extends RuntimeException {
    public VendorAlreadyExistsException() {
        super("You already have a vendor application");
    }
}