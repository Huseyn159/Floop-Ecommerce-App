package com.floop.product.exception;

public class UnauthorizedProductAccessException extends RuntimeException {
    public UnauthorizedProductAccessException() {
        super("You are not authorized to modify this product");
    }
}