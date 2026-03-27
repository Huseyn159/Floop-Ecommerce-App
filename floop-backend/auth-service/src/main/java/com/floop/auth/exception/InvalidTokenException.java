package com.floop.auth.exception;

public class InvalidTokenException extends RuntimeException {
    public InvalidTokenException() {
        super("Token is invalid or expired");
    }
}