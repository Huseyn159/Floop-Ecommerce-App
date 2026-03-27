package com.floop.order.controller;

import com.floop.order.dto.*;
import com.floop.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestHeader("X-User-Id") UUID customerId,
            @Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(customerId, request));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID orderId) {
        return ResponseEntity.ok(orderService.getOrder(orderId, userId));
    }

    @GetMapping("/my")
    public ResponseEntity<OrderPageResponse> getMyOrders(
            @RequestHeader("X-User-Id") UUID customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.getMyOrders(customerId, page, size));
    }

    @GetMapping("/vendor")
    public ResponseEntity<OrderPageResponse> getVendorOrders(
            @RequestHeader("X-User-Id") UUID vendorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.getVendorOrders(vendorId, page, size));
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @RequestHeader("X-User-Id") UUID vendorId,
            @PathVariable UUID orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(
                orderService.updateOrderStatus(orderId, vendorId, request));
    }

    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @RequestHeader("X-User-Id") UUID customerId,
            @PathVariable UUID orderId,
            @RequestParam String reason) {
        return ResponseEntity.ok(
                orderService.cancelOrder(orderId, customerId, reason));
    }
}