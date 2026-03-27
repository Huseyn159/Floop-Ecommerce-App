package com.floop.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuth2Request {

    @NotBlank
    private String idToken;
}