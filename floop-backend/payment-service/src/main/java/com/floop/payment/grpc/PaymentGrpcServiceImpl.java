package com.floop.payment.grpc;

import com.floop.grpc.*;
import com.floop.payment.entity.Payment;
import com.floop.payment.entity.PaymentStatus;
import com.floop.payment.entity.PaymentTransaction;
import com.floop.payment.entity.TransactionType;
import com.floop.payment.event.PaymentResultEvent;
import com.floop.payment.event.producer.PaymentEventProducer;
import com.floop.payment.repository.PaymentRepository;
import com.floop.payment.repository.PaymentTransactionRepository;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

// @GrpcService → bu class gRPC server-dir
// order-service buraya gRPC sorğu göndərəcək
@Slf4j
@GrpcService
@RequiredArgsConstructor
public class PaymentGrpcServiceImpl extends
        PaymentGrpcServiceGrpc.PaymentGrpcServiceImplBase {

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentEventProducer paymentEventProducer;

    @Override
    @Transactional
    public void initiatePayment(PaymentRequest request,
                                StreamObserver<PaymentResponse> responseObserver) {

        log.info("gRPC InitiatePayment: orderId={}", request.getOrderId());

        try {
            UUID orderId = UUID.fromString(request.getOrderId());
            UUID customerId = UUID.fromString(request.getCustomerId());

            // Bu sifariş üçün ödəniş artıq varsa — duplicate
            if (paymentRepository.findByOrderId(orderId).isPresent()) {
                log.warn("Payment already exists for orderId={}", orderId);
                responseObserver.onNext(PaymentResponse.newBuilder()
                        .setStatus("FAILED")
                        .setMessage("Payment already exists")
                        .build());
                responseObserver.onCompleted();
                return;
            }

            // Payment yarat
            Payment payment = Payment.builder()
                    .orderId(orderId)
                    .customerId(customerId)
                    .amount(request.getAmount())
                    .currency(request.getCurrency())
                    // Mock Stripe ID — real-da Stripe-dan gələcək
                    .stripePaymentIntentId("pi_mock_" + UUID.randomUUID())
                    .build();

            Payment saved = paymentRepository.save(payment);

            // Transaction yarat — CHARGE
            PaymentTransaction transaction = PaymentTransaction.builder()
                    .payment(saved)
                    .type(TransactionType.CHARGE)
                    .amount(request.getAmount())
                    .description("Payment for order: " + orderId)
                    .build();

            transactionRepository.save(transaction);

            // Mock: hər zaman SUCCESS
            // Real-da: Stripe API çağırılır
            saved.setStatus(PaymentStatus.SUCCESS);
            paymentRepository.save(saved);

            // Kafka-ya SUCCESS event göndər
            // order-service bu event-i alıb sifarişi CONFIRMED edəcək
            paymentEventProducer.sendPaymentResult(
                    PaymentResultEvent.builder()
                            .orderId(orderId)
                            .paymentId(saved.getId().toString())
                            .status("SUCCESS")
                            .message("Payment processed successfully")
                            .build()
            );

            // gRPC cavabı qaytar
            responseObserver.onNext(PaymentResponse.newBuilder()
                    .setPaymentId(saved.getId().toString())
                    .setStatus("SUCCESS")
                    .setMessage("Payment processed successfully")
                    .build());
            responseObserver.onCompleted();

            log.info("Payment SUCCESS: orderId={}", orderId);

        } catch (Exception e) {
            log.error("Payment failed: {}", e.getMessage());

            responseObserver.onNext(PaymentResponse.newBuilder()
                    .setStatus("FAILED")
                    .setMessage(e.getMessage())
                    .build());
            responseObserver.onCompleted();
        }
    }

    @Override
    @Transactional
    public void cancelPayment(CancelPaymentRequest request,
                              StreamObserver<CancelPaymentResponse> responseObserver) {

        log.info("gRPC CancelPayment: paymentId={}", request.getPaymentId());

        try {
            UUID paymentId = UUID.fromString(request.getPaymentId());

            paymentRepository.findById(paymentId).ifPresent(payment -> {
                payment.setStatus(PaymentStatus.CANCELLED);
                paymentRepository.save(payment);

                // REFUND transaction yarat
                PaymentTransaction transaction = PaymentTransaction.builder()
                        .payment(payment)
                        .type(TransactionType.REFUND)
                        .amount(payment.getAmount())
                        .description("Refund: " + request.getReason())
                        .build();

                transactionRepository.save(transaction);
            });

            responseObserver.onNext(CancelPaymentResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Payment cancelled")
                    .build());
            responseObserver.onCompleted();

        } catch (Exception e) {
            responseObserver.onNext(CancelPaymentResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage(e.getMessage())
                    .build());
            responseObserver.onCompleted();
        }
    }
}
