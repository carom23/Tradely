package com.auth.tradely_auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

public record AuthResponse(
        String accessToken,
        @JsonIgnore String refreshToken,
        String id,
        String email,
        String hlWalletAddress
) {}
