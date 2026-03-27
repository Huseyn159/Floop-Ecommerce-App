package com.floop.vendor.exception;

public class StoreSlugAlreadyTakenException extends RuntimeException {
    public StoreSlugAlreadyTakenException(String slug) {
        super("Store slug already taken: " + slug);
    }
}