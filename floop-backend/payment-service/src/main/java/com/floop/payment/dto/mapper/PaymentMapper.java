package com.floop.payment.dto.mapper;

import com.floop.payment.dto.PaymentResponse;
import com.floop.payment.dto.TransactionResponse;
import com.floop.payment.entity.Payment;
import com.floop.payment.entity.PaymentTransaction;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PaymentMapper {
    PaymentResponse toResponse(Payment payment);
    TransactionResponse toTransactionResponse(PaymentTransaction transaction);
}