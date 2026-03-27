package com.floop.product.exception;

public class InvalidFlashSaleException extends RuntimeException {
  public InvalidFlashSaleException(String message) {
    super(message);
  }
}