package com.floop.order.service.impl;

import com.floop.order.dto.*;
import com.floop.order.dto.mapper.OrderMapper;
import com.floop.order.entity.*;
import com.floop.order.event.OrderPlacedEvent;
import com.floop.order.event.producer.OrderEventProducer;
import com.floop.order.exception.*;
import com.floop.order.grpc.PaymentGrpcClient;
import com.floop.order.grpc.PaymentRequest;
import com.floop.order.grpc.PaymentResponse;
import com.floop.order.repository.*;
import com.floop.order.service.OrderService;
import com.floop.order.websocket.OrderWebSocketHandler;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final ProductSnapshotRepository productSnapshotRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderMapper orderMapper;
    private final OrderEventProducer orderEventProducer;
    private final OrderWebSocketHandler webSocketHandler;
    private final PaymentGrpcClient paymentGrpcClient;




    @Override
    @Transactional
    public OrderResponse createOrder(UUID customerId, CreateOrderRequest request) {

        List<UUID> productIds = request.getItems().stream()
                .map(OrderItemRequest::getProductId)
                .toList();

        Map<UUID, ProductSnapshot> snapshotMap = productSnapshotRepository
                .findAllById(productIds)
                .stream()
                .collect(Collectors.toMap(ProductSnapshot::getProductId, s -> s));

        for (UUID productId : productIds) {
            ProductSnapshot snapshot = snapshotMap.get(productId);
            if (snapshot == null) {
                throw new ProductNotFoundException(productId);
            }
            if (!"ACTIVE".equals(snapshot.getStatus())) {
                throw new ProductNotAvailableException(productId);
            }
        }

        UUID vendorId = snapshotMap.values().iterator().next().getVendorId();

        double totalAmount = request.getItems().stream()
                .mapToDouble(item -> {
                    ProductSnapshot snapshot = snapshotMap.get(item.getProductId());
                    return item.getQuantity() * snapshot.getEffectivePrice();
                })
                .sum();

        Order order = Order.builder()
                .customerId(customerId)
                .vendorId(vendorId)
                .totalAmount(totalAmount)
                .currency(request.getCurrency())
                .shippingAddress(request.getShippingAddress())
                .shippingCity(request.getShippingCity())
                .shippingCountry(request.getShippingCountry())
                .shippingZipCode(request.getShippingZipCode())
                .build();

        Order saved = orderRepository.save(order);

        List<OrderItem> items = request.getItems().stream()
                .map(itemRequest -> {
                    ProductSnapshot snapshot = snapshotMap.get(itemRequest.getProductId());
                    double unitPrice = snapshot.getEffectivePrice();
                    return OrderItem.builder()
                            .order(saved)
                            .productId(itemRequest.getProductId())
                            .variantId(itemRequest.getVariantId())
                            .quantity(itemRequest.getQuantity())
                            .unitPrice(unitPrice)
                            .totalPrice(itemRequest.getQuantity() * unitPrice)
                            .build();
                })
                .toList();

        orderItemRepository.saveAll(items);

        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId(saved.getId().toString())
                .customerId(customerId.toString())
                .amount(totalAmount)
                .currency(request.getCurrency())
                .build();

        PaymentResponse paymentResponse = paymentGrpcClient.initiatePayment(paymentRequest);

        if ("FAILED".equals(paymentResponse.getStatus())) {
            throw new PaymentFailedException(paymentResponse.getMessage());
        }

        // Kafka event
        orderEventProducer.sendOrderPlacedEvent(
                OrderPlacedEvent.builder()
                        .orderId(saved.getId())
                        .customerId(customerId)
                        .vendorId(vendorId)
                        .totalAmount(totalAmount)
                        .currency(request.getCurrency())
                        .build()
        );

        webSocketHandler.sendOrderUpdate(saved.getId(), saved.getStatus());

        log.info("Order created: orderId={}, customerId={}", saved.getId(), customerId);
        return orderMapper.toResponse(saved);
    }

    @Override
    public OrderResponse getOrder(UUID orderId, UUID userId) {
        Order order = findOrderOrThrow(orderId);

        if (!order.getCustomerId().equals(userId) &&
                !order.getVendorId().equals(userId)) {
            throw new UnauthorizedOrderAccessException();
        }

        return orderMapper.toResponse(order);
    }

    @Override
    public OrderPageResponse getMyOrders(UUID customerId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orderPage = orderRepository
                .findByCustomerId(customerId, pageable);

        return buildPageResponse(orderPage, page, size);
    }

    @Override
    public OrderPageResponse getVendorOrders(UUID vendorId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orderPage = orderRepository
                .findByVendorId(vendorId, pageable);

        return buildPageResponse(orderPage, page, size);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, UUID vendorId,
                                           UpdateOrderStatusRequest request) {
        Order order = findOrderOrThrow(orderId);

        if (!order.getVendorId().equals(vendorId)) {
            throw new UnauthorizedOrderAccessException();
        }

        validateStatusTransition(order.getStatus(), request.getStatus());

        order.setStatus(request.getStatus());

        if (request.getTrackingNumber() != null) {
            order.setTrackingNumber(request.getTrackingNumber());
        }

        Order updated = orderRepository.save(order);

        webSocketHandler.sendOrderUpdate(updated.getId(), updated.getStatus());

        log.info("Order status updated: orderId={}, status={}",
                orderId, request.getStatus());

        return orderMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(UUID orderId, UUID customerId, String reason) {
        Order order = findOrderOrThrow(orderId);

        if (!order.getCustomerId().equals(customerId)) {
            throw new UnauthorizedOrderAccessException();
        }

        if (order.getStatus() != OrderStatus.PENDING &&
                order.getStatus() != OrderStatus.CONFIRMED) {
            throw new InvalidOrderStatusException(
                    "Only PENDING or CONFIRMED orders can be cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason);

        Order cancelled = orderRepository.save(order);

        // Ödənişi geri al
        if (order.getPaymentId() != null) {
            paymentGrpcClient.cancelPayment(order.getPaymentId(), reason);
        }

        webSocketHandler.sendOrderUpdate(cancelled.getId(), cancelled.getStatus());

        log.info("Order cancelled: orderId={}", orderId);
        return orderMapper.toResponse(cancelled);
    }

    // --- Private metodlar ---

    private Order findOrderOrThrow(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == OrderStatus.CONFIRMED ||
                    next == OrderStatus.CANCELLED;
            case CONFIRMED -> next == OrderStatus.PROCESSING ||
                    next == OrderStatus.CANCELLED;
            case PROCESSING -> next == OrderStatus.SHIPPED;
            case SHIPPED -> next == OrderStatus.DELIVERED;
            default -> false;
        };

        if (!valid) {
            throw new InvalidOrderStatusException(
                    "Invalid status transition: " + current + " → " + next);
        }
    }

    private OrderPageResponse buildPageResponse(Page<Order> page,
                                                int currentPage, int size) {
        return OrderPageResponse.builder()
                .content(page.getContent().stream()
                        .map(orderMapper::toResponse)
                        .toList())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .currentPage(currentPage)
                .pageSize(size)
                .hasNext(page.hasNext())
                .build();
    }
}