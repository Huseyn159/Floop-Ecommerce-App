package com.floop.vendor.exception;

public class VendorNotApprovedException extends RuntimeException {
    public VendorNotApprovedException() {
        super("Vendor account is not approved yet");
    }
}