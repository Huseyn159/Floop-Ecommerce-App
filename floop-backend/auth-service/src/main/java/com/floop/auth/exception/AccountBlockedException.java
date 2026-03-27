package com.floop.auth.exception;

public class AccountBlockedException extends RuntimeException {
    public AccountBlockedException() {
        super("Account has been blocked");
    }
}