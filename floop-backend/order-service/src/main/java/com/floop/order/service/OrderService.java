package com.floop.order.service;

import com.floop.order.dto.*;
import java.util.UUID;

public interface OrderService {
    OrderResponse createOrder(UUID customerId, CreateOrderRequest request);
    OrderResponse getOrder(UUID orderId, UUID userId);
    OrderPageResponse getMyOrders(UUID customerId, int page, int size);
    OrderPageResponse getVendorOrders(UUID vendorId, int page, int size);
    OrderResponse updateOrderStatus(UUID orderId, UUID vendorId, UpdateOrderStatusRequest request);
    OrderResponse cancelOrder(UUID orderId, UUID customerId, String reason);
}