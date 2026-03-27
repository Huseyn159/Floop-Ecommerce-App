package com.floop.vendor.exception;

import java.util.UUID;

public class VendorNotFoundException extends RuntimeException {
  public VendorNotFoundException(UUID userId) {
    super("Vendor not found with id: " + userId);
  }
}