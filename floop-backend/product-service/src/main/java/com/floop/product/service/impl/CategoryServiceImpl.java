package com.floop.product.service.impl;

import com.floop.product.dto.CategoryResponse;
import com.floop.product.dto.mapper.CategoryMapper;
import com.floop.product.exception.CategoryNotFoundException;
import com.floop.product.repository.CategoryRepository;
import com.floop.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories")
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findByParentIsNullAndActiveTrue()
                .stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "category", key = "#slug")
    public CategoryResponse getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
                .map(categoryMapper::toResponse)
                .orElseThrow(() -> new CategoryNotFoundException(slug));
    }
}