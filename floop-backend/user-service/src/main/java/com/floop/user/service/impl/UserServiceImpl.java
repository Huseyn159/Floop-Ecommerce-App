package com.floop.user.service.impl;

import com.floop.user.dto.*;
import com.floop.user.dto.mapper.UserAddressMapper;
import com.floop.user.dto.mapper.UserProfileMapper;
import com.floop.user.entity.UserAddress;
import com.floop.user.entity.UserProfile;
import com.floop.user.exception.*;
import com.floop.user.repository.UserAddressRepository;
import com.floop.user.repository.UserProfileRepository;
import com.floop.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserProfileRepository userProfileRepository;
    private final UserAddressRepository userAddressRepository;

    private final UserProfileMapper userProfileMapper;
    private final UserAddressMapper userAddressMapper;

    private static final int MAX_ADDRESS_LIMIT = 5;

    @Override
    public UserProfileResponse getProfile(UUID userId) {
        UserProfile profile = findProfileOrThrow(userId);

        return userProfileMapper.toResponse(profile);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        UserProfile profile = findProfileOrThrow(userId);

        if (request.getFirstName() != null) profile.setFirstName(request.getFirstName());
        if (request.getLastName() != null) profile.setLastName(request.getLastName());
        if (request.getPhoneNumber() != null) profile.setPhoneNumber(request.getPhoneNumber());
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getEmailNotifications() != null) profile.setEmailNotifications(request.getEmailNotifications());
        if (request.getPushNotifications() != null) profile.setPushNotifications(request.getPushNotifications());
        if (request.getLanguage() != null) profile.setLanguage(request.getLanguage());
        if (request.getCurrency() != null) profile.setCurrency(request.getCurrency());

        return userProfileMapper.toResponse(userProfileRepository.save(profile));
    }

    @Override
    public List<AddressResponse> getAddresses(UUID userId) {
        // Əvvəlcə user mövcuddurmu yoxla
        findProfileOrThrow(userId);

        // Bütün ünvanları tap, hər birini AddressResponse-a çevir
        return userAddressRepository.findByUserProfileUserId(userId)
                .stream()
                .map(userAddressMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AddressResponse addAddress(UUID userId, CreateAddressRequest request) {
        UserProfile profile = findProfileOrThrow(userId);

        // User 5-dən çox ünvan əlavə edə bilməz
        if (userAddressRepository.countByUserProfileUserId(userId) >= MAX_ADDRESS_LIMIT) {
            throw new AddressLimitExceededException();
        }

        // Yeni ünvan default seçilibsə — əvvəlki default-u sıfırla
        if (request.isDefault()) {
            resetDefaultAddress(userId);
        }

        // MapStruct CreateAddressRequest → UserAddress çevirir
        UserAddress address = userAddressMapper.toEntity(request);
        address.setUserProfile(profile); // Manuel set edirik — mapper ignore edir

        return userAddressMapper.toResponse(userAddressRepository.save(address));
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(UUID userId, UUID addressId,
                                         UpdateAddressRequest request) {
        UserAddress address = findAddressOrThrow(addressId);

        // Təhlükəsizlik — bu ünvan həqiqətən bu user-ə aiddir?
        validateAddressOwnership(address, userId);

        // PATCH — yalnız göndərilən fieldləri yenilə
        if (request.getTitle() != null) address.setTitle(request.getTitle());
        if (request.getFullName() != null) address.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) address.setPhoneNumber(request.getPhoneNumber());
        if (request.getCountry() != null) address.setCountry(request.getCountry());
        if (request.getCity() != null) address.setCity(request.getCity());
        if (request.getDistrict() != null) address.setDistrict(request.getDistrict());
        if (request.getAddressLine() != null) address.setAddressLine(request.getAddressLine());
        if (request.getZipCode() != null) address.setZipCode(request.getZipCode());

        // Default ünvan dəyişirsə — əvvəlkini sıfırla
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            resetDefaultAddress(userId);
            address.setDefault(true);
        }

        return userAddressMapper.toResponse(userAddressRepository.save(address));
    }

    @Override
    @Transactional
    public void deleteAddress(UUID userId, UUID addressId) {
        UserAddress address = findAddressOrThrow(addressId);
        validateAddressOwnership(address, userId);
        userAddressRepository.delete(address);
    }

    @Override
    @Transactional
    public void setDefaultAddress(UUID userId, UUID addressId) {
        UserAddress address = findAddressOrThrow(addressId);
        validateAddressOwnership(address, userId);

        // Əvvəlki default-u sıfırla, yenisini set et
        resetDefaultAddress(userId);
        address.setDefault(true);
        userAddressRepository.save(address);
    }

    // --- Private köməkçi metodlar ---

    // Profil tapılmadıqda exception at
    private UserProfile findProfileOrThrow(UUID userId) {
        return userProfileRepository.findById(userId)
                .orElseThrow(() -> new UserProfileNotFoundException(userId));
    }

    // Ünvan tapılmadıqda exception at
    private UserAddress findAddressOrThrow(UUID addressId) {
        return userAddressRepository.findById(addressId)
                .orElseThrow(() -> new AddressNotFoundException(addressId));
    }

    // Ünvan bu user-ə aiddir yoxlaması
    private void validateAddressOwnership(UserAddress address, UUID userId) {
        if (!address.getUserProfile().getUserId().equals(userId)) {
            throw new UnauthorizedAccessException();
        }
    }

    // Bütün ünvanların default-unu false et
    // Yeni default təyin ediləndə çağırılır
    private void resetDefaultAddress(UUID userId) {
        userAddressRepository.findByUserProfileUserId(userId)
                .forEach(addr -> {
                    addr.setDefault(false);
                    userAddressRepository.save(addr);
                });
    }
}