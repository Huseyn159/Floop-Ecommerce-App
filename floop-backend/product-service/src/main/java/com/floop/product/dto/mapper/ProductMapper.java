package com.floop.product.dto.mapper;

import com.floop.product.dto.ProductImageResponse;
import com.floop.product.dto.ProductResponse;
import com.floop.product.dto.ProductVariantResponse;
import com.floop.product.entity.Product;
import com.floop.product.entity.ProductImage;
import com.floop.product.entity.ProductVariant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {CategoryMapper.class})
public interface ProductMapper {

    @Mapping(target = "effectivePrice", expression = "java(product.getEffectivePrice())")
    @Mapping(target = "isOnSale", expression = "java(product.isOnSale())")
    @Mapping(target = "discountPercentage", expression = "java(product.getDiscountPercentage())")
    ProductResponse toResponse(Product product);

    ProductVariantResponse toVariantResponse(ProductVariant variant);
    @Mapping(source = "primary", target = "isPrimary")
    ProductImageResponse toImageResponse(ProductImage image);
}