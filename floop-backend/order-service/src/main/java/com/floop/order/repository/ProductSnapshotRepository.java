package com.floop.order.repository;

import com.floop.order.entity.ProductSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ProductSnapshotRepository extends JpaRepository<ProductSnapshot, UUID> {
}