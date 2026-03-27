package com.floop.auth.service;

import com.floop.auth.dto.AuthResponse;
import com.floop.auth.dto.LoginRequest;
import com.floop.auth.dto.RegisterRequest;
import com.floop.auth.entity.User;
import com.floop.auth.event.UserEventProducer;
import com.floop.auth.exception.EmailNotVerifiedException;
import com.floop.auth.exception.PasswordMismatchException;
import com.floop.auth.exception.UserAlreadyExistsException;
import com.floop.auth.exception.UserNotFoundException;
import com.floop.auth.repository.UserRepository;
import com.floop.auth.repository.VerificationTokenRepository;
import com.floop.auth.security.JwtUtil;
import com.floop.auth.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserEventProducer userEventProducer;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private EmailService emailService;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthServiceImpl authService;


    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@gmail.com");
        registerRequest.setPassword("Test1234!");
        registerRequest.setConfirmPassword("Test1234!");
        registerRequest.setFirstName("Huseyn");
        registerRequest.setLastName("Test");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@gmail.com");
        loginRequest.setPassword("Test1234!");

        testUser = com.floop.auth.entity.User.builder()
                .id(UUID.randomUUID())
                .email("test@gmail.com")
                .password("hashedPassword")
                .firstName("Huseyn")
                .lastName("Test")
                .role(com.floop.auth.entity.Role.CUSTOMER)
                .emailVerified(true)
                .blocked(false)
                .failedLoginAttempts(0)
                .build();

    }



    @Test
    @DisplayName("Register — şifrələr uyğun gəlmirsə exception atır")
    void register_passwordMismatch_throwsException() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        registerRequest.setConfirmPassword("WrongPassword!");

        assertThrows(PasswordMismatchException.class, () -> {
            authService.register(registerRequest);
        });
    }

    @Test
    @DisplayName("Register — email artıq mövcuddursa exception atır")
    void register_emailAlreadyExists_throwsException() {

        when(userRepository.existsByEmail(anyString())).thenReturn(true);


        // Act + Assert: UserAlreadyExistsException gözlə
        assertThrows(UserAlreadyExistsException.class,()-> {
            authService.register(registerRequest);
        });
    }

    @Test
    @DisplayName("Register - save ve send verification cagirilmalidir")
    void register_saveAndSendVerification_shouldWork(){
        authService.register(registerRequest);


        verify(userRepository, times(1)).save(any());
        verify(emailService, times(1)).sendVerificationEmail(
                anyString(), anyString(), anyString());
    }


    @Test
    @DisplayName("Login - User tapilmirsa exception atmalidir")
    void login_userNotFound_throwsException(){

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> {
            authService.login(loginRequest);
        });
    }

    @Test
    @DisplayName("Login - email tesdiq olunmayibsa exception")
    void login_emailNotVerified_throwsException(){
        testUser.setEmailVerified(false);
        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(testUser));

        assertThrows(EmailNotVerifiedException.class, () -> {
            authService.login(loginRequest);
        });
    }

    @Test
    @DisplayName("Login - sifre yalnisdirsa exception")
    void login_wrongPassword_throwsException(){

        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(),anyString()))
                .thenReturn(false);

        assertThrows(UserNotFoundException.class,() -> {
            authService.login(loginRequest);
        });

    }

    @Test
    @DisplayName("Login - ugurlu loginde token qayitmalidir")
    void login_successful_returnToken(){

        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString()))
                .thenReturn(true);
        when(jwtUtil.generateAccessToken(anyString(), anyString(),anyString()))
                .thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(anyString()))
                .thenReturn("refresh-token");

        AuthResponse response = authService.login(loginRequest);
        assertNotNull(response.getAccessToken());
        assertEquals("access-token", response.getAccessToken());
    }


}