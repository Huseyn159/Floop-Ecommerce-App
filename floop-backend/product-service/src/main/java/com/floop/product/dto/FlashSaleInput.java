package com.floop.product.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FlashSaleInput {

    @NotNull
    @DecimalMin(value = "0.01")
    private Double discountedPrice;

    @NotNull
    @Future
    private LocalDateTime saleEndTime;
}