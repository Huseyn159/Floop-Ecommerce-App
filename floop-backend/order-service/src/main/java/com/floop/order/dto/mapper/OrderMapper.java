package com.floop.order.dto.mapper;

import com.floop.order.dto.OrderItemResponse;
import com.floop.order.dto.OrderResponse;
import com.floop.order.entity.Order;
import com.floop.order.entity.OrderItem;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    OrderResponse toResponse(Order order);
    OrderItemResponse toItemResponse(OrderItem item);
}