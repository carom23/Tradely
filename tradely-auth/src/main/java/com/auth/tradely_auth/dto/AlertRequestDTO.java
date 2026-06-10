package com.auth.tradely_auth.dto;

import com.auth.tradely_auth.entity.AlertType;
import com.auth.tradely_auth.entity.AlertScope;
import com.auth.tradely_auth.entity.AlertMetric;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AlertRequestDTO(
    @NotNull AlertScope scope,
    @NotNull AlertMetric metric,
    @NotNull AlertType type,      // ABOVE / BELOW
    String coin,                  // obligatorio si scope = POSITION
    String direction,             // "LONG"/"SHORT" si aplica
    @NotNull BigDecimal threshold,
    @NotBlank String email
) {}
