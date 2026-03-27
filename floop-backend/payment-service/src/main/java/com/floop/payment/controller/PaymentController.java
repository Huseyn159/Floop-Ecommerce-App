package com.floop.payment.controller;

import com.floop.payment.dto.PaymentResponse;
import com.floop.payment.dto.TransactionResponse;
import com.floop.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // Ödəniş məlumatı
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPayment(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID paymentId) {
        return ResponseEntity.ok(paymentService.getPayment(paymentId));
    }

    // Sifarişin ödənişi
    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrder(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId));
    }

    // Müştərinin ödəniş tarixçəsi
    @GetMapping("/my")
    public ResponseEntity<List<PaymentResponse>> getMyPayments(
            @RequestHeader("X-User-Id") UUID customerId) {
        return ResponseEntity.ok(paymentService.getCustomerPayments(customerId));
    }

    // Transaction tarixçəsi
    @GetMapping("/{paymentId}/transactions")
    public ResponseEntity<List<TransactionResponse>> getTransactions(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID paymentId) {
        return ResponseEntity.ok(paymentService.getTransactions(paymentId));
    }
}