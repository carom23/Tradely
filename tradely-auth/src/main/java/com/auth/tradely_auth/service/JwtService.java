package com.auth.tradely_auth.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessExpMs;
    private final long refreshExpMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expiration-ms}") long accessExpMs,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpMs = accessExpMs;
        this.refreshExpMs = refreshExpMs;
    }


    public String generateAccessToken(String userId, String email) {
        return Jwts.builder().subject(userId)
                .claims(Map.of(
                        "email", email,
                        "type",
                        "access"))
                .issuedAt(new Date())
                .expiration(
                        new Date(
                        System.currentTimeMillis() + accessExpMs
                                 ))
                .signWith(key)
                .compact();
    }


    public String generateRefreshToken(String userId) {
        return Jwts.builder()
                .subject(userId)
                .claims(Map.of(
                        "type", "refresh"
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpMs))
                .signWith(key)
                .compact();
    }


    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }


    public boolean isRefreshToken(Claims claims) {
        return "refresh".equals(claims.get(
                "type", String.class
        ));
    }
}