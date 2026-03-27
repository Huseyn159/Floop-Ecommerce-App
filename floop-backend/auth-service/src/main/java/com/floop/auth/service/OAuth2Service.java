package com.floop.auth.service;

import com.floop.auth.dto.AuthResponse;
import com.floop.auth.dto.OAuth2Request;

public interface OAuth2Service {
    AuthResponse loginWithGoogle(OAuth2Request request);
}