package com.auth.tradely_auth.controller;

import lombok.extern.slf4j.Slf4j;
import com.auth.tradely_auth.dto.AuthResponse;
import com.auth.tradely_auth.dto.LoginRequest;
import com.auth.tradely_auth.dto.RegisterRequest;
import com.auth.tradely_auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> 
    register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, 
                    buildRefreshTokenCookie(response.refreshToken())
                    .toString())
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> 
    login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, 
                    buildRefreshTokenCookie(response
                        .refreshToken())
                        .toString())
                .body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).build();
        }
        try {
            AuthResponse response = authService.refreshToken(refreshToken);
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(response.refreshToken()).toString())
                    .body(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        try {
            authService.forgotPassword(email);
            return ResponseEntity.ok(java.util.Map.of("message", "Solicitud procesada. Si el correo existe, se ha enviado un enlace de restablecimiento."));
        } catch (Exception e) {
            log.error("Error al procesar la recuperacion de contrasena para {}: ", email, e);
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Error al procesar la solicitud: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(java.util.Map.of("message", "Contraseña restablecida correctamente."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            authService.verifyEmail(token);
            return ResponseEntity.ok(java.util.Map.of("message", "Correo verificado correctamente. Ya puedes iniciar sesión."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    private ResponseCookie buildRefreshTokenCookie(String refreshToken) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true) 
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();
    }
}
