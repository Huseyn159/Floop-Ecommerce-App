package com.floop.product.controller;

import com.floop.product.dto.*;
import com.floop.product.service.CategoryService;
import com.floop.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.ContextValue;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ProductResolver {

    private final ProductService productService;
    private final CategoryService categoryService;

    // ===== QUERIES =====

    @QueryMapping
    public ProductResponse product(@Argument String id) {
        return productService.getProduct(UUID.fromString(id));
    }

    @QueryMapping
    public ProductPageResponse products(
            @Argument ProductFilter filter,
            @Argument Integer page,
            @Argument Integer size) {
        return productService.getProducts(
                filter,
                page != null ? page : 0,
                size != null ? size : 20);
    }

    @QueryMapping
    public List<ProductResponse> popularProducts(
            @Argument String categoryId,
            @Argument Integer limit) {
        return productService.getPopularProducts(
                categoryId != null ? UUID.fromString(categoryId) : null,
                limit != null ? limit : 10);
    }

    @QueryMapping
    public List<ProductResponse> trendingProducts(@Argument Integer limit) {
        return productService.getTrendingProducts(
                limit != null ? limit : 10);
    }

    @QueryMapping
    public List<ProductResponse> flashSaleProducts() {
        return productService.getFlashSaleProducts();
    }

    @QueryMapping
    public List<CategoryResponse> categories() {
        return categoryService.getAllCategories();
    }

    @QueryMapping
    public CategoryResponse category(@Argument String slug) {
        return categoryService.getCategoryBySlug(slug);
    }

    @QueryMapping
    public ProductPageResponse vendorProducts(
            @Argument String vendorId,
            @Argument Integer page,
            @Argument Integer size) {
        return productService.getVendorProducts(
                UUID.fromString(vendorId),
                page != null ? page : 0,
                size != null ? size : 20);
    }

    // ===== MUTATIONS =====

    // Schema-da: createProduct(input): Product!
    // vendorId gateway-dən gələcək — hələlik header-dən alırıq
    @MutationMapping
    public ProductResponse createProduct(
            @Argument ProductInput input,
            @ContextValue(required = false) String userId) {
        if (userId == null) {
            throw new RuntimeException("İcazə yoxdur");
        }
        return productService.createProduct(UUID.fromString(userId), input);
    }

    @MutationMapping
    public ProductResponse updateProduct(
            @Argument String id,
            @Argument ProductInput input,
            @ContextValue(required = false) String userId
    ) {
        return productService.updateProduct(
                UUID.fromString(userId),
                UUID.fromString(id),
                input);
    }

    @MutationMapping
    public boolean deleteProduct(
            @Argument String id,
            @ContextValue(required = false) String userId
    ) {
        return productService.deleteProduct(
                UUID.fromString(userId),
                UUID.fromString(id));
    }

    @MutationMapping
    public ProductResponse startFlashSale(
            @Argument String productId,
            @Argument FlashSaleInput input,
            @ContextValue(required = false) String userId
    ) {
        return productService.startFlashSale(
                UUID.fromString(userId),
                UUID.fromString(productId),
                input);
    }

    @MutationMapping
    public ProductResponse endFlashSale(
            @Argument String productId,
            @ContextValue(required = false) String userId
    ) {
        return productService.endFlashSale(
                UUID.fromString(userId),
                UUID.fromString(productId));
    }

    @MutationMapping
    public ProductImageResponse addProductImage(
            @Argument String productId,
            @Argument String url,
            @Argument String publicId,
            @Argument Boolean isPrimary,
            @ContextValue(required = false) String userId
    ) {
        return productService.addProductImage(
                UUID.fromString(userId),
                UUID.fromString(productId),
                url,
                publicId,
                isPrimary);
    }

    @MutationMapping
    public boolean removeProductImage(
            @Argument String imageId,
            @ContextValue(required = false) String userId
    ) {
        return productService.removeProductImage(
                UUID.fromString(userId),
                UUID.fromString(imageId));
    }
}
