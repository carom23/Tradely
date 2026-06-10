package com.auth.tradely_auth.dto;

import com.auth.tradely_auth.entity.Alert;
import com.auth.tradely_auth.entity.AlertType;
import com.auth.tradely_auth.entity.AlertScope;
import com.auth.tradely_auth.entity.AlertMetric;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AlertResponseDTO(
    UUID id,
    AlertScope scope,
    AlertMetric metric,
    String coin,
    String direction,
    String email,
    AlertType type,
    BigDecimal threshold,
    boolean active,
    boolean emailNotified,
    Instant createdAt,
    String userEmail,
    String hlWalletAddress
) {
    public static AlertResponseDTO from(Alert alert) {
        return new AlertResponseDTO(
            alert.getId(),
            alert.getScope(),
            alert.getMetric(),
            alert.getCoin(),
            alert.getDirection(),
            alert.getEmail(),
            alert.getType(),
            alert.getThreshold(),
            alert.isActive(),
            alert.isEmailNotified(),
            alert.getCreatedAt(),
            alert.getUser() != null ? alert.getUser().getEmail() : null,
            alert.getUser() != null ? alert.getUser().getHlWalletAddress() : null
        );
    }
}
