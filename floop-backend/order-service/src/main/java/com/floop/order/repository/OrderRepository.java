package com.floop.order.repository;

import com.floop.order.entity.Order;
import com.floop.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    Page<Order> findByCustomerId(UUID customerId, Pageable pageable);
    Page<Order> findByVendorId(UUID vendorId, Pageable pageable);
    Page<Order> findByVendorIdAndStatus(UUID vendorId, OrderStatus status, Pageable pageable);
    List<Order> findByCustomerIdAndStatus(UUID customerId, OrderStatus status);
}