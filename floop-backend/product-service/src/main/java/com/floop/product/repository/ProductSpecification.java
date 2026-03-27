package com.floop.product.repository;

import com.floop.product.dto.ProductFilter;
import com.floop.product.entity.Product;
import com.floop.product.entity.ProductStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    // Filter-e göre dinamik WHERE yaradiriq
    public static Specification<Product> withFilter(ProductFilter filter) {
        return (root, query, criteriaBuilder) -> {

            List<Predicate> predicates = new ArrayList<>();


            predicates.add(criteriaBuilder.notEqual(
                    root.get("status"), ProductStatus.DELETED));

            if (filter == null) {
                return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
            }


            if (filter.getCategoryId() != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("category").get("id"), filter.getCategoryId()));
            }

            if (filter.getVendorId() != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("vendorId"), filter.getVendorId()));
            }

            if (filter.getMinPrice() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("basePrice"), filter.getMinPrice()));
            }

            if (filter.getMaxPrice() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("basePrice"), filter.getMaxPrice()));
            }

            if (filter.getMinRating() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("rating"), filter.getMinRating()));
            }

            if (Boolean.TRUE.equals(filter.getInStockOnly())) {
                predicates.add(criteriaBuilder.notEqual(
                        root.get("status"), ProductStatus.OUT_OF_STOCK));
            }

            if (Boolean.TRUE.equals(filter.getOnSaleOnly())) {
                predicates.add(criteriaBuilder.isNotNull(
                        root.get("discountedPrice")));
            }

            if (filter.getSearchQuery() != null &&
                    !filter.getSearchQuery().isBlank()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("name")),
                        "%" + filter.getSearchQuery().toLowerCase() + "%"));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}