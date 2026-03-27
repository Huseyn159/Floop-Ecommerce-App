package com.floop.product.service;

import com.floop.product.dto.CategoryResponse;
import java.util.List;
import java.util.UUID;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    CategoryResponse getCategoryBySlug(String slug);
}