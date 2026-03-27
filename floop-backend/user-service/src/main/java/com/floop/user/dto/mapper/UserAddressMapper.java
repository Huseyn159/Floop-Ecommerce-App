package com.floop.user.dto.mapper;

import com.floop.user.dto.AddressResponse;
import com.floop.user.dto.CreateAddressRequest;
import com.floop.user.entity.UserAddress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserAddressMapper {
    AddressResponse toResponse(UserAddress address);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userProfile", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    UserAddress toEntity(CreateAddressRequest request);
}