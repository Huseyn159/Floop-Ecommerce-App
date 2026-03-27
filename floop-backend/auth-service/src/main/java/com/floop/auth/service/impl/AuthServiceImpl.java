package com.floop.auth.service.impl;

import com.floop.auth.dto.AuthResponse;
import com.floop.auth.dto.LoginRequest;
import com.floop.auth.dto.RegisterRequest;
import com.floop.auth.entity.Role;
import com.floop.auth.entity.TokenType;
import com.floop.auth.entity.User;
import com.floop.auth.entity.VerificationToken;
import com.floop.auth.event.UserEventProducer;
import com.floop.auth.event.UserRegisteredEvent;
import com.floop.auth.exception.*;
import com.floop.auth.repository.UserRepository;
import com.floop.auth.repository.VerificationTokenRepository;
import com.floop.auth.security.JwtUtil;
import com.floop.auth.service.AuthService;
import com.floop.auth.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final VerificationTokenRepository verificationTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    //blacklist ve cache ucun
    private final RedisTemplate<String, String> redisTemplate;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private final UserEventProducer userEventProducer;



    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(request.getEmail());
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException();
        }
//CASE SENSIVITY MESELESIN YADDA SAXLA QAYIDARSAN
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.CUSTOMER)
                .build();

        userRepository.save(user);

        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .user(user)
                .token(token)
                .type(TokenType.EMAIL_VERIFICATION)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        verificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), token);

        userEventProducer.sendUserRegisteredEvent(
                UserRegisteredEvent.builder()
                        .userId(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .provider("local")
                        .build()



        );
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException(request.getEmail()));


        if (user.isBlocked()) {
            throw new AccountBlockedException();
        }


        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException();
        }

        if (isLockedOut(user)) {
            throw new AccountBlockedException();
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            handleFailedLogin(user);
            throw new UserNotFoundException(request.getEmail());
        }

        //ugurlu giris,attempt 0-lanir
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository
                .findByTokenAndType(token, TokenType.EMAIL_VERIFICATION)
                .orElseThrow(InvalidTokenException::new);

        if (verificationToken.isExpired()) {
            throw new InvalidTokenException();
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        verificationTokenRepository.delete(verificationToken);
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));

        verificationTokenRepository.deleteByUserIdAndType(
                user.getId(), TokenType.PASSWORD_RESET);

        String token = UUID.randomUUID().toString();
        VerificationToken resetToken = VerificationToken.builder()
                .user(user)
                .token(token)
                .type(TokenType.PASSWORD_RESET)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();

        verificationTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), token);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new PasswordMismatchException();
        }

        VerificationToken resetToken = verificationTokenRepository
                .findByTokenAndType(token, TokenType.PASSWORD_RESET)
                .orElseThrow(InvalidTokenException::new);

        if (resetToken.isExpired()) {
            throw new InvalidTokenException();
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        verificationTokenRepository.delete(resetToken);
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        // Token etibarlıdırmı?
        if (!jwtUtil.isTokenValid(refreshToken)) {
            throw new InvalidTokenException();
        }

        // Token blacklist-dədirsə (logout edilib) rədd et
        if (Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + refreshToken))) {
            throw new InvalidTokenException();
        }

        String email = jwtUtil.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));

        return buildAuthResponse(user);
    }

    @Override
    public void logout(String refreshToken) {
        if (!jwtUtil.isTokenValid(refreshToken)) {
            throw new InvalidTokenException();
        }


        long expiration = jwtUtil.getExpirationTime(refreshToken);

        // Redis-də blacklist-ə əlavə et — token-in ömrü qədər saxla
        // Beləliklə token onsuz da bitəndə Redis-dən silinəcək, yaddaş israf olmayacaq
        redisTemplate.opsForValue().set(
                "blacklist:" + refreshToken,
                "true",
                expiration,
                TimeUnit.MILLISECONDS
        );
    }



    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId().toString());

        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .role(user.getRole().name())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build();
    }

    // Müvəqqəti kilidlənibmi yoxla
    private boolean isLockedOut(User user) {
        return user.getLockedUntil() != null &&
                user.getLockedUntil().isAfter(LocalDateTime.now());
    }

    // Yanlış şifrə — failed attempts artır, lazım gəlsə kilid qoy
    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= MAX_FAILED_ATTEMPTS) {

            user.setLockedUntil(LocalDateTime.now().plusMinutes(30));
        }

        userRepository.save(user);
    }
}