package com.floop.vendor.dto.mapper;

import com.floop.vendor.dto.VendorApplicationRequest;
import com.floop.vendor.dto.VendorResponse;
import com.floop.vendor.entity.Vendor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface VendorMapper {

    VendorResponse toResponse(Vendor vendor);

}