package com.auth.tradely_auth.dto;

import jakarta.validation.constraints.NotBlank;
public record RefreshInput(
        @NotBlank String refreshToken
) {}

