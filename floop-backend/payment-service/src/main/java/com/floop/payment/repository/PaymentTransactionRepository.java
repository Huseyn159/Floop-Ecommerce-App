package com.floop.payment.repository;

import com.floop.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PaymentTransactionRepository
        extends JpaRepository<PaymentTransaction, UUID> {
    List<PaymentTransaction> findByPaymentId(UUID paymentId);
}