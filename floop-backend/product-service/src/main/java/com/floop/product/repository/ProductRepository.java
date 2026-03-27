package com.floop.product.repository;

import com.floop.product.entity.Product;
import com.floop.product.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>,
        JpaSpecificationExecutor<Product> {

    Page<Product> findByVendorIdAndStatusNot(
            UUID vendorId, ProductStatus status, Pageable pageable);

    //satis sayina gore populyar
    List<Product> findTop10ByCategoryIdAndStatusOrderBySalesCountDesc(
            UUID categoryId, ProductStatus status);

    //butun categoryde populyar
    List<Product> findTopByStatusOrderBySalesCountDesc(
            ProductStatus status, Pageable pageable);

    // viewCount-a görə son 24 saatda trend
    @Query("SELECT p FROM Product p WHERE p.status = :status " +
            "ORDER BY p.viewCount DESC")
    List<Product> findTrendingProducts(
            @Param("status") ProductStatus status, Pageable pageable);

    // Flash sale — active olanlar
    @Query("SELECT p FROM Product p WHERE p.discountedPrice IS NOT NULL " +
            "AND p.saleEndTime > :now AND p.status = 'ACTIVE'")
    List<Product> findActiveFlashSaleProducts(@Param("now") LocalDateTime now);

    // viewCount artir
    @Modifying
    @Query("UPDATE Product p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") UUID id);
}