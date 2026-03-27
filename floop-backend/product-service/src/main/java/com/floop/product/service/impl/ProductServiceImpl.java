package com.floop.product.service.impl;

import com.floop.product.dto.*;
import com.floop.product.dto.mapper.ProductMapper;
import com.floop.product.entity.*;
import com.floop.product.exception.*;
import com.floop.product.repository.*;
import com.floop.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;
    private final ProductMapper productMapper;
    private final CacheManager cacheManager;

    @Override
    @Transactional // ← incrementViewCount @Modifying-dir, transaction lazımdır
    @Cacheable(value = "product", key = "#id")
    public ProductResponse getProduct(UUID id) {
        Product product = findProductOrThrow(id);
        productRepository.incrementViewCount(id);
        return productMapper.toResponse(product);
    }

    @Override
    public ProductPageResponse getProducts(ProductFilter filter, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Product> productPage = productRepository.findAll(
                ProductSpecification.withFilter(filter), pageable);

        return buildPageResponse(productPage, page, size);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "products", allEntries = true),
            //@CacheEvict(value = "popularProducts", allEntries = true)
    })
    public ProductResponse createProduct(UUID vendorId, ProductInput input) {
        Category category = categoryRepository.findById(input.getCategoryId())
                .orElseThrow(() -> new CategoryNotFoundException(
                        input.getCategoryId().toString()));

        Product product = Product.builder()
                .vendorId(vendorId)
                .category(category)
                .name(input.getName())
                .description(input.getDescription())
                .basePrice(input.getBasePrice())
                .build();

        Product saved = productRepository.save(product);


        if (input.getVariants() != null && !input.getVariants().isEmpty()) {
            List<ProductVariant> variants = new ArrayList<>();

            input.getVariants().forEach(variantInput -> {
                if (variantRepository.existsBySku(variantInput.getSku())) {
                    throw new DuplicateSkuException(variantInput.getSku());
                }
                variants.add(ProductVariant.builder()
                        .product(saved)
                        .size(variantInput.getSize())
                        .color(variantInput.getColor())
                        .material(variantInput.getMaterial())
                        .priceModifier(variantInput.getPriceModifier())
                        .stockQuantity(variantInput.getStockQuantity())
                        .sku(variantInput.getSku())
                        .build());
            });

            variantRepository.saveAll(variants);
        }

        log.info("Product created: id={}, vendorId={}", saved.getId(), vendorId);
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "product", key = "#productId"),
            @CacheEvict(value = "products", allEntries = true)
    })
    public ProductResponse updateProduct(UUID vendorId, UUID productId,
                                         ProductInput input) {
        Product product = findProductOrThrow(productId);
        validateProductOwnership(product, vendorId);

        if (input.getName() != null) product.setName(input.getName());
        if (input.getDescription() != null) product.setDescription(input.getDescription());
        if (input.getBasePrice() != null) product.setBasePrice(input.getBasePrice());

        if (input.getCategoryId() != null) {
            Category category = categoryRepository.findById(input.getCategoryId())
                    .orElseThrow(() -> new CategoryNotFoundException(
                            input.getCategoryId().toString()));
            product.setCategory(category);
        }

        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "product", key = "#productId"),
            @CacheEvict(value = "products", allEntries = true),
            @CacheEvict(value = "popularProducts", allEntries = true)
    })
    public boolean deleteProduct(UUID vendorId, UUID productId) {
        Product product = findProductOrThrow(productId);
        validateProductOwnership(product, vendorId);

        product.setStatus(ProductStatus.DELETED);
        productRepository.save(product);

        log.info("Product soft deleted: id={}", productId);
        return true;
    }

    @Override
    @Cacheable(value = "popularProducts",
            key = "#categoryId != null ? #categoryId : 'all'")
    public List<ProductResponse> getPopularProducts(UUID categoryId, int limit) {
        List<Product> products;

        if (categoryId != null) {
            products = productRepository
                    .findTop10ByCategoryIdAndStatusOrderBySalesCountDesc(
                            categoryId, ProductStatus.ACTIVE);
        } else {
            products = productRepository.findTopByStatusOrderBySalesCountDesc(
                    ProductStatus.ACTIVE, PageRequest.of(0, limit));
        }

        return products.stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    @Cacheable(value = "trendingProducts")
    public List<ProductResponse> getTrendingProducts(int limit) {
        return productRepository.findTrendingProducts(
                        ProductStatus.ACTIVE, PageRequest.of(0, limit))
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    @Cacheable(value = "flashSale")
    public List<ProductResponse> getFlashSaleProducts() {
        return productRepository.findActiveFlashSaleProducts(LocalDateTime.now())
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    public ProductPageResponse getVendorProducts(UUID vendorId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Product> productPage = productRepository
                .findByVendorIdAndStatusNot(vendorId, ProductStatus.DELETED, pageable);

        return buildPageResponse(productPage, page, size);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "product", key = "#productId"),
            @CacheEvict(value = "flashSale", allEntries = true)
    })
    public ProductResponse startFlashSale(UUID vendorId, UUID productId,
                                          FlashSaleInput input) {
        Product product = findProductOrThrow(productId);
        validateProductOwnership(product, vendorId);

        if (input.getDiscountedPrice() >= product.getBasePrice()) {
            throw new InvalidFlashSaleException(
                    "Discounted price must be less than base price");
        }

        product.setDiscountedPrice(input.getDiscountedPrice());
        product.setSaleEndTime(input.getSaleEndTime());

        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "product", key = "#productId"),
            @CacheEvict(value = "flashSale", allEntries = true)
    })
    public ProductResponse endFlashSale(UUID vendorId, UUID productId) {
        Product product = findProductOrThrow(productId);
        validateProductOwnership(product, vendorId);

        product.setDiscountedPrice(null);
        product.setSaleEndTime(null);

        return productMapper.toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    @CacheEvict(value = "product", key = "#productId")
    public ProductImageResponse addProductImage(UUID vendorId, UUID productId,
                                                String url, String publicId, Boolean isPrimary) {
        Product product = findProductOrThrow(productId);
        validateProductOwnership(product, vendorId);

        if (Boolean.TRUE.equals(isPrimary)) {
            // Əvvəlki primary-ni sıfırla — saveAll ilə bir sorğu
            List<ProductImage> images =
                    imageRepository.findByProductIdOrderBySortOrderAsc(productId);
            images.forEach(img -> img.setPrimary(false));
            imageRepository.saveAll(images); // ← optimization
        }

        ProductImage image = ProductImage.builder()
                .product(product)
                .url(url)
                .publicId(publicId)
                .isPrimary(Boolean.TRUE.equals(isPrimary))
                .sortOrder(0)
                .build();

        return productMapper.toImageResponse(imageRepository.save(image));
    }

    @Override
    @Transactional
    public boolean removeProductImage(UUID vendorId, UUID imageId) {
        ProductImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ProductNotFoundException(imageId));

        validateProductOwnership(image.getProduct(), vendorId);


        UUID productId = image.getProduct().getId();
        var cache = cacheManager.getCache("product");
        if (cache != null) {
            cache.evict(productId);
        }

        imageRepository.delete(image);
        return true;
    }



    private Product findProductOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    private void validateProductOwnership(Product product, UUID vendorId) {
        if (!product.getVendorId().equals(vendorId)) {
            throw new UnauthorizedProductAccessException();
        }
    }


    private ProductPageResponse buildPageResponse(Page<Product> page,
                                                  int currentPage, int size) {
        return ProductPageResponse.builder()
                .content(page.getContent().stream()
                        .map(productMapper::toResponse)
                        .toList())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .currentPage(currentPage)
                .pageSize(size)
                .hasNext(page.hasNext())
                .build();
    }
}
