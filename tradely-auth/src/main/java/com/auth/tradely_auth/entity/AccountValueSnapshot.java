package com.auth.tradely_auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account_value_snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountValueSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "wallet_address", nullable = false)
    private String walletAddress;

    @Column(name = "account_value", nullable = false, precision = 30, scale = 18)
    private BigDecimal accountValue;

    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt;
}
