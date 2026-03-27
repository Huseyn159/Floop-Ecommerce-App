package com.floop.user.service;


import com.floop.user.dto.CreateAddressRequest;
import com.floop.user.dto.UserProfileResponse;
import com.floop.user.dto.mapper.UserAddressMapper;
import com.floop.user.dto.mapper.UserProfileMapper;
import com.floop.user.entity.UserAddress;
import com.floop.user.entity.UserProfile;
import com.floop.user.exception.AddressLimitExceededException;
import com.floop.user.exception.UserProfileNotFoundException;
import com.floop.user.repository.UserAddressRepository;
import com.floop.user.repository.UserProfileRepository;
import com.floop.user.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserAddressRepository userAddressRepository;

    @Mock
    private UserProfileMapper userProfileMapper;

    @Mock
    private UserAddressMapper userAddressMapper;

    @InjectMocks
    private UserServiceImpl userService;

    private UserProfile testProfile;
    private UserAddress testAddress;
    private UserProfileResponse testResponse;
    private CreateAddressRequest testAddressDto;

    @BeforeEach
    void setUp(){
         testProfile = UserProfile.builder()
                .userId(UUID.randomUUID())
                .email("test@gmail.com")
                .firstName("Testing")
                .lastName("Testovich")
                .build();

         testAddress = UserAddress.builder()
                .id(UUID.randomUUID())
                .fullName("Test Testzade")
                .title("TestAddress1")
                .addressLine("TestStation")
                .city("Baku")
                .district("Narimanov")
                .country("Azerbaijan")
                .zipCode("1001")
                .phoneNumber("+994517770727")
                .build();

         testResponse = UserProfileResponse.builder()
                 .userId(testProfile.getUserId())
                 .email(testProfile.getEmail())
                 .firstName(testProfile.getFirstName())
                 .lastName(testProfile.getLastName())
                 .build();

        testAddressDto = new CreateAddressRequest();
        testAddressDto.setTitle("TestAddress1");
        testAddressDto.setFullName("Test Testzade");
        testAddressDto.setPhoneNumber("+994517770727");
        testAddressDto.setCountry("Azerbaijan");
        testAddressDto.setCity("Baku");
        testAddressDto.setDistrict("Narimanov");
        testAddressDto.setAddressLine("TestStation");
        testAddressDto.setZipCode("AZ1001");
    }

    @Test
    @DisplayName("GetProfile - Profil tapilarsa response qayidir")
    void getProfile_return_response() {
        when(userProfileRepository.findById(any()))
                .thenReturn(Optional.of(testProfile));

        when(userProfileMapper.toResponse(any()))
                .thenReturn(testResponse);


        var response = userService.getProfile(testProfile.getUserId());

        assertNotNull(response);
        assertEquals(testProfile.getEmail(), response.getEmail());
    }

    @Test
    @DisplayName("GetProfile - Profil tapilmasa UserNotFoundException atir")
    void getProfile_throw_UserNotFoundException(){
        when(userProfileRepository.findById(any()))
                .thenReturn(Optional.empty());

        assertThrows(UserProfileNotFoundException.class,() -> {
            userService.getProfile(testProfile.getUserId());
        });
    }

    @Test
    @DisplayName("AddAddress - limit asilibsa AddressLimitExceededException atir")
    void addAddress_throw_AddressLimitExceededException(){
        when(userProfileRepository.findById(any()))
                .thenReturn(Optional.of(testProfile));

        when(userAddressRepository.countByUserProfileUserId(any()))
                .thenReturn(5L);

        assertThrows(AddressLimitExceededException.class, () -> {
            userService.addAddress(testProfile.getUserId(), testAddressDto);
        });
    }

    @Test
    @DisplayName("DeleteAddress - başqasının ünvanını silməyə çalışırsa UnauthorizedAccessException atır")
    void deleteAddress_attemptAnotherUsersAddress_throw_UnauthorizedAccessException() {
        testAddress.setUserProfile(UserProfile.builder()
                .userId(UUID.randomUUID())
                .build());

        when(userAddressRepository.findById(any()))
                .thenReturn(Optional.of(testAddress));

        assertThrows(com.floop.user.exception.UnauthorizedAccessException.class, () -> {
            userService.deleteAddress(testProfile.getUserId(), testAddress.getId());
        });
    }

}
