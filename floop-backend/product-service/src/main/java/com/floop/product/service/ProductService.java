package com.floop.product.service;

import com.floop.product.dto.*;
import java.util.List;
import java.util.UUID;

public interface ProductService {
    ProductResponse getProduct(UUID id);
    ProductPageResponse getProducts(ProductFilter filter, int page, int size);
    ProductResponse createProduct(UUID vendorId, ProductInput input);
    ProductResponse updateProduct(UUID vendorId, UUID productId, ProductInput input);
    boolean deleteProduct(UUID vendorId, UUID productId);
    List<ProductResponse> getPopularProducts(UUID categoryId, int limit);
    List<ProductResponse> getTrendingProducts(int limit);
    List<ProductResponse> getFlashSaleProducts();
    ProductPageResponse getVendorProducts(UUID vendorId, int page, int size);
    ProductResponse startFlashSale(UUID vendorId, UUID productId, FlashSaleInput input);
    ProductResponse endFlashSale(UUID vendorId, UUID productId);
    ProductImageResponse addProductImage(UUID vendorId, UUID productId,
                                         String url, String publicId, Boolean isPrimary);
    boolean removeProductImage(UUID vendorId, UUID imageId);
}