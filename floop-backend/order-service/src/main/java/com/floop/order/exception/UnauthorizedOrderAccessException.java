package com.floop.order.exception;

public class UnauthorizedOrderAccessException extends RuntimeException {
    public UnauthorizedOrderAccessException() {
        super("You are not authorized to access this order");
    }
}