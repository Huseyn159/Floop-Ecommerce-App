package com.floop.product.dto.mapper;

import com.floop.product.dto.CategoryResponse;
import com.floop.product.entity.Category;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    CategoryResponse toResponse(Category category);
}