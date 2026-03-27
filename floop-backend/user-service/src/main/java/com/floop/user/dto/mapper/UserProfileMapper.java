package com.floop.user.dto.mapper;

import com.floop.user.dto.UserProfileResponse;
import com.floop.user.entity.UserProfile;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {
    UserProfileResponse toResponse(UserProfile profile);
}