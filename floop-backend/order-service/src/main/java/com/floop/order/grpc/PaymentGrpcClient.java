package com.floop.order.grpc;

import com.floop.grpc.CancelPaymentRequest;
import com.floop.grpc.CancelPaymentResponse;
import com.floop.grpc.PaymentGrpcServiceGrpc;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class PaymentGrpcClient {

    @Value("${grpc.client.payment-service.address:static://localhost:9091}")
    private String paymentServiceAddress;

    private PaymentGrpcServiceGrpc.PaymentGrpcServiceBlockingStub stub;

    @PostConstruct
    public void init() {
        // "static://localhost:9091" → "localhost:9091"
        String address = paymentServiceAddress
                .replace("static://", "");
        String host = address.split(":")[0];
        int port = Integer.parseInt(address.split(":")[1]);

        ManagedChannel channel = ManagedChannelBuilder
                .forAddress(host, port)
                .usePlaintext()
                .build();

        stub = PaymentGrpcServiceGrpc.newBlockingStub(channel);
        log.info("gRPC client connected to payment-service: {}:{}", host, port);
    }

    @CircuitBreaker(name = "payment-service", fallbackMethod = "initiatePaymentFallback")
    public PaymentResponse initiatePayment(PaymentRequest request) {
        log.info("Initiating payment via gRPC: orderId={}", request.getOrderId());

        com.floop.grpc.PaymentResponse response = stub.initiatePayment(
                com.floop.grpc.PaymentRequest.newBuilder()
                        .setOrderId(request.getOrderId())
                        .setCustomerId(request.getCustomerId())
                        .setAmount(request.getAmount())
                        .setCurrency(request.getCurrency())
                        .build()
        );

        PaymentResponse result = new PaymentResponse();
        result.setPaymentId(response.getPaymentId());
        result.setStatus(response.getStatus());
        result.setMessage(response.getMessage());
        return result;
    }

    public PaymentResponse initiatePaymentFallback(PaymentRequest request, Exception e) {
        log.error("Payment service unavailable: {}", e.getMessage());
        PaymentResponse response = new PaymentResponse();
        response.setStatus("FAILED");
        response.setMessage("Payment service temporarily unavailable");
        return response;
    }

    @CircuitBreaker(name = "payment-service", fallbackMethod = "cancelPaymentFallback")
    public boolean cancelPayment(String paymentId, String reason) {
        log.info("Cancelling payment via gRPC: paymentId={}", paymentId);

        CancelPaymentResponse response = stub.cancelPayment(
                CancelPaymentRequest.newBuilder()
                        .setPaymentId(paymentId)
                        .setReason(reason)
                        .build()
        );

        return response.getSuccess();
    }

    public boolean cancelPaymentFallback(String paymentId, String reason, Exception e) {
        log.error("Payment cancel failed: {}", e.getMessage());
        return false;
    }
}