package com.floop.auth.controller;

import com.floop.auth.dto.*;
import com.floop.auth.exception.InvalidTokenException;
import com.floop.auth.service.AuthService;
import com.floop.auth.service.OAuth2Service;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final OAuth2Service oauth2Service;
    private final AuthService authService;


    @PostMapping("/oauth2/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(
            @Valid @RequestBody OAuth2Request request,
            HttpServletResponse response) {
        AuthResponse authResponse = oauth2Service.loginWithGoogle(request);
        addRefreshTokenCookie(response, authResponse.getRefreshToken());
        authResponse.setRefreshToken(null);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok("Verification email sent. Please check your inbox.");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);

        // Refresh token-i HttpOnly cookie-yə yaz — JavaScript oxuya bilməsin
        addRefreshTokenCookie(response, authResponse.getRefreshToken());

        // Body-dən refresh token-i sil — yalnız cookie-də olsun
        authResponse.setRefreshToken(null);

        return ResponseEntity.ok(authResponse);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok("Email verified successfully.");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody String email) {
        authService.forgotPassword(email);
        return ResponseEntity.ok("Password reset email sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(
                request.getToken(),
                request.getNewPassword(),
                request.getConfirmPassword()
        );
        return ResponseEntity.ok("Password reset successfully.");
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(
            HttpServletRequest request,
            HttpServletResponse response) {
        // Refresh token-i cookie-dən oxu
        String refreshToken = extractRefreshTokenFromCookie(request);
        AuthResponse authResponse = authService.refreshToken(refreshToken);

        // Yeni refresh token-i cookie-yə yaz
        addRefreshTokenCookie(response, authResponse.getRefreshToken());
        authResponse.setRefreshToken(null);

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        // Cookie-dən refresh token-i oxu, blacklist-ə əlavə et
        String refreshToken = extractRefreshTokenFromCookie(request);
        authService.logout(refreshToken);

        // Cookie-ni sil
        clearRefreshTokenCookie(response);

        return ResponseEntity.ok("Logged out successfully.");
    }



    // Refresh token-i HttpOnly cookie-yə yazır
    private void addRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refresh_token", token);
        cookie.setHttpOnly(true);           // JavaScript oxuya bilməsin
        cookie.setSecure(false);            // Production-da TRUE olacaq (HTTPS)
        cookie.setPath("/api/auth");        // Yalnız auth endpoint-lərə göndərilsin
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 gün
        response.addCookie(cookie);
    }

    // Cookie-dən refresh token-i oxuyur
    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw new InvalidTokenException();
        }
        for (Cookie cookie : request.getCookies()) {
            if ("refresh_token".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        throw new InvalidTokenException();
    }

    // Logout zamanı cookie-ni silir (MaxAge=0)
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refresh_token", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0); // Dərhal sil
        response.addCookie(cookie);
    }
}