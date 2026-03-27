package com.floop.payment.service.impl;

import com.floop.payment.dto.PaymentResponse;
import com.floop.payment.dto.TransactionResponse;
import com.floop.payment.dto.mapper.PaymentMapper;
import com.floop.payment.exception.PaymentNotFoundException;
import com.floop.payment.repository.PaymentRepository;
import com.floop.payment.repository.PaymentTransactionRepository;
import com.floop.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentMapper paymentMapper;

    @Override
    public PaymentResponse getPayment(UUID paymentId) {
        return paymentRepository.findById(paymentId)
                .map(paymentMapper::toResponse)
                .orElseThrow(() -> new PaymentNotFoundException(paymentId));
    }

    @Override
    public PaymentResponse getPaymentByOrderId(UUID orderId) {
        return paymentRepository.findByOrderId(orderId)
                .map(paymentMapper::toResponse)
                .orElseThrow(() -> new PaymentNotFoundException(orderId));
    }

    @Override
    public List<PaymentResponse> getCustomerPayments(UUID customerId) {
        return paymentRepository.findByCustomerId(customerId)
                .stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Override
    public List<TransactionResponse> getTransactions(UUID paymentId) {
        return transactionRepository.findByPaymentId(paymentId)
                .stream()
                .map(paymentMapper::toTransactionResponse)
                .toList();
    }
}