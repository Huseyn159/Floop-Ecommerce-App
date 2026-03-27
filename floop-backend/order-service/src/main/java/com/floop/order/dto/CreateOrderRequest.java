package com.floop.order.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class CreateOrderRequest {

    @NotNull
    @Size(min = 1)
    private List<OrderItemRequest> items;

    @NotBlank
    private String shippingAddress;

    @NotBlank
    private String shippingCity;

    @NotBlank
    private String shippingCountry;

    @NotBlank
    private String shippingZipCode;

    private String currency = "AZN";
}