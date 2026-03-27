package com.floop.payment.service;

import com.floop.payment.dto.PaymentResponse;
import com.floop.payment.dto.TransactionResponse;
import java.util.List;
import java.util.UUID;

public interface PaymentService {
    // Ödəniş məlumatlarını gör
    PaymentResponse getPayment(UUID paymentId);

    // Sifarişin ödənişini gör
    PaymentResponse getPaymentByOrderId(UUID orderId);

    // Müştərinin ödəniş tarixçəsi
    List<PaymentResponse> getCustomerPayments(UUID customerId);

    // Ödənişin transaction-ları
    List<TransactionResponse> getTransactions(UUID paymentId);
}