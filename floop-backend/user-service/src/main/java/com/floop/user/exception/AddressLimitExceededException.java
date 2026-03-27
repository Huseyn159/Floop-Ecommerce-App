package com.floop.user.exception;

public class AddressLimitExceededException extends RuntimeException {
    public AddressLimitExceededException() {
        super("Maximum address limit reached. You can add up to 5 addresses.");
    }
}