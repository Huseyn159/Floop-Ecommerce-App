package com.floop.product.service;


import com.floop.product.dto.*;
import com.floop.product.dto.mapper.ProductMapper;
import com.floop.product.entity.Category;
import com.floop.product.entity.Product;
import com.floop.product.entity.ProductStatus;
import com.floop.product.exception.*;
import com.floop.product.repository.CategoryRepository;
import com.floop.product.repository.ProductImageRepository;
import com.floop.product.repository.ProductRepository;
import com.floop.product.repository.ProductVariantRepository;
import com.floop.product.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceImplTest {

    @Mock
    private  ProductRepository productRepository;
    @Mock
    private  CategoryRepository categoryRepository;
    @Mock
    private  ProductVariantRepository variantRepository;
    @Mock
    private  ProductImageRepository imageRepository;
    @Mock
    private  ProductMapper productMapper;
    @Mock
    private  CacheManager cacheManager;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product testProduct;
    private ProductResponse testResponse;
    private ProductInput testInput;
    private UUID testVendorId;
    private UUID testProductId;
    private UUID testCategoryId;

    @BeforeEach
    void setUp() {
        testVendorId = UUID.randomUUID();
        testProductId = UUID.randomUUID();
        testCategoryId = UUID.randomUUID();

        testProduct = Product.builder()
                .id(testProductId)
                .vendorId(testVendorId)
                .name("iPhone 15")
                .basePrice(999.99)
                .status(ProductStatus.ACTIVE)
                .build();

        testResponse = ProductResponse.builder()
                .id(testProductId)
                .name("iPhone 15")
                .basePrice(999.99)
                .build();

        testInput = new ProductInput();
        testInput.setName("iPhone 15");
        testInput.setBasePrice(999.99);
        testInput.setCategoryId(testCategoryId);
    }

    @Test
    @DisplayName("GetProduct - tapılırsa response qayıdır")
    void getProduct_found_returnsResponse() {
        when(productRepository.findById(any()))
                .thenReturn(Optional.of(testProduct));
        when(productMapper.toResponse(any()))
                .thenReturn(testResponse);

        ProductResponse result = productService.getProduct(testProductId);

        assertNotNull(result);
        assertEquals(testProduct.getName(), result.getName());
        verify(productRepository, times(1)).incrementViewCount(any());
    }

    @Test
    @DisplayName("GetProduct - tapilmirsa ProductNotFoundException atir")
    void getProduct_whenNotFound_throwsProductNotFoundException(){
        when(productRepository.findById(any()))
                .thenReturn(Optional.empty());

        assertThrows(ProductNotFoundException.class,()->{
            productService.getProduct(testProductId);
        });
    }

    @Test
    @DisplayName("CreateProduct - kateqoriya tapılmırsa CategoryNotFoundException atır")
    void createProduct_whenCategoryNotFound_throwsCategoryNotFoundException(){
        when(categoryRepository.findById(any()))
                .thenReturn(Optional.empty());

        assertThrows(CategoryNotFoundException.class,()->{
           productService.createProduct(testVendorId,testInput);
        });
    }

    @Test
    @DisplayName("CreateProduct — SKU artıq mövcuddursa DuplicateSkuException atır")
    void createProduct_whenSkuAlreadyExists_throwsDuplicateSkuException(){
        Category category = new Category();



        ProductVariantInput variantInput = new ProductVariantInput();
        variantInput.setSku("TEST-SKU-123");
        testInput.setVariants(List.of(variantInput));

        when(categoryRepository.findById(any()))
                .thenReturn(Optional.of(category));


        when(productRepository.save(any()))
                .thenReturn(testProduct);

        when(variantRepository.existsBySku(any()))
                .thenReturn(true);

        assertThrows(DuplicateSkuException.class, () -> {
            productService.createProduct(testVendorId, testInput);
        });
    }

    @Test
    @DisplayName("DeleteProduct - basqa vendorun mehsulun silmeye calisanda " +
            "-> UnauthorizedProductAccessException")
    void deleteProduct_whenTryToDeleteAnotherVendorsProduct_throwsUnauthorizedProductAccessException(){
        when(productRepository.findById(any()))
                .thenReturn(Optional.of(testProduct));

        testProduct.setVendorId(UUID.randomUUID());

        assertThrows(UnauthorizedProductAccessException.class,()->{
            productService.deleteProduct(testVendorId,testProductId);
        });
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("DeleteProduct - uğurlu silinmə zamanı status DELETED olur")
    void deleteProduct_success_updatesStatusToDeleted() {
        when(productRepository.findById(testProductId)).thenReturn(Optional.of(testProduct));

        productService.deleteProduct(testVendorId, testProductId);

        assertEquals(ProductStatus.DELETED, testProduct.getStatus());
        verify(productRepository, times(1)).save(testProduct);
    }

    @Test
    @DisplayName("StartFlashSale — discountedPrice >= basePrice olduqda InvalidFlashSaleException atır")
    void startFlashSale_ifBasePriceIsLowerOrEquals_throwsInvalidFlashSaleException(){
        when(productRepository.findById(any()))
                .thenReturn(Optional.of(testProduct));

        FlashSaleInput saleInput = new FlashSaleInput();
        saleInput.setDiscountedPrice(2000.00);
        saleInput.setSaleEndTime(LocalDateTime.now());

        assertThrows(InvalidFlashSaleException.class,() ->{
            productService.startFlashSale(testVendorId,testProductId,saleInput);
        });

    }


    @Test
    @DisplayName("UpdateProduct - məlumatlar uğurla yenilənir")
    void updateProduct_success_updatesFieldsAndReturnsResponse() {
        when(productRepository.findById(testProductId))
                .thenReturn(Optional.of(testProduct));
        when(productRepository.save(any()))
                .thenReturn(testProduct);
        when(productMapper.toResponse(any()))
                .thenReturn(testResponse);
        when(categoryRepository.findById(any()))
                .thenReturn(Optional.of(new Category()));

        testInput.setName("New iPhone Name");
        testInput.setBasePrice(1100.0);

        ProductResponse result = productService.updateProduct(testVendorId, testProductId, testInput);

        assertNotNull(result);
        assertEquals("New iPhone Name", testProduct.getName());
        assertEquals(1100.0, testProduct.getBasePrice());
        verify(productRepository).save(testProduct);
    }

    @Test
    @DisplayName("CreateProduct - variantlar daxil olduqda hamısı uğurla yadda saxlanılır")
    void createProduct_withVariants_success() {
        Category category = new Category();
        ProductVariantInput v1 = new ProductVariantInput();
        v1.setSku("SKU-1");
        testInput.setVariants(List.of(v1));

        when(categoryRepository.findById(any())).thenReturn(Optional.of(category));
        when(productRepository.save(any())).thenReturn(testProduct);
        when(variantRepository.existsBySku("SKU-1")).thenReturn(false);
        when(productMapper.toResponse(any())).thenReturn(testResponse);

        productService.createProduct(testVendorId, testInput);

        verify(variantRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("UpdateProduct - başqa vendorun məhsulun update etməyə çalışanda Unauthorized atır")
    void updateProduct_whenNotOwner_throwsUnauthorizedProductAccessException() {
        when(productRepository.findById(testProductId))
                .thenReturn(Optional.of(testProduct));

        UUID strangerVendorId = UUID.randomUUID();


        assertThrows(UnauthorizedProductAccessException.class, () -> {
            productService.updateProduct(strangerVendorId, testProductId, testInput);
        });

        verify(productRepository, never()).save(any());
}


}
