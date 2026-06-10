package com.auth.tradely_auth.service;

import com.auth.tradely_auth.dto.AuthResponse;
import com.auth.tradely_auth.dto.LoginRequest;
import com.auth.tradely_auth.dto.RegisterRequest;
import com.auth.tradely_auth.entity.User;
import com.auth.tradely_auth.repository.UserRepository;
import com.auth.tradely_auth.service.JwtService;
import org.springframework.beans.factory.annotation.Value;
import io.jsonwebtoken.Claims;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.math.BigDecimal;

@Slf4j
@Service
public class AuthService {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final com.auth.tradely_auth.client.HyperliquidClientService hyperliquidClientService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthenticationManager authenticationManager,
                       EmailService emailService,
                       com.auth.tradely_auth.client.HyperliquidClientService hyperliquidClientService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
        this.hyperliquidClientService = hyperliquidClientService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        String token = UUID.randomUUID().toString();

        User user = User.builder()
                .id(UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 25))
                .email(request.email())
                .passwordHash(passwordEncoder
                    .encode(request.password()))
                .isActive(false)
                .emailVerificationToken(token)
                .build();

        userRepository.save(user);

        String verificationLink = frontendUrl + "/verify-email?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), verificationLink);

        return new AuthResponse(null,
             null, 
             user.getId(), 
             user.getEmail(), 
             null);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!user.isActive()) {
            throw new IllegalArgumentException("Por favor, verifica tu correo electrónico antes de iniciar sesión.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        String accessToken = jwtService
        .generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtService
        .generateRefreshToken(user.getId());

        return new AuthResponse(accessToken, 
            refreshToken, 
            user.getId(), 
            user.getEmail(), 
            user.getHlWalletAddress());
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("El enlace de verificación no es válido o ha expirado."));

        user.setActive(true);
        user.setEmailVerificationToken(null);
        userRepository.save(user);
        log.info("Usuario verificado y activado exitosamente: {}", user.getEmail());
    }

    public AuthResponse refreshToken(String refreshToken) {
        try {
            Claims claims = jwtService.validateToken(refreshToken);
            
            if (jwtService.isRefreshToken(claims)) {
                String userId = claims.getSubject();
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
                        
                String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
                String newRefreshToken = jwtService.generateRefreshToken(user.getId()); // Rotación de refresh token
                
                return new AuthResponse(accessToken, newRefreshToken, user.getId(), user.getEmail(), user.getHlWalletAddress());
            }
        } catch (Exception e) {
            // Refresco fallido por firma inválida, expiración o formato
        }
        throw new IllegalArgumentException("Refresh token inválido o expirado");
    }

    public User getUserByIdentifier(String identifier) {
        return userRepository.findById(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + identifier));
    }

    public void updateUserWallets(String identifier, String hlWalletAddress) {
        User user = getUserByIdentifier(identifier);
        user.setHlWalletAddress(hlWalletAddress);
        userRepository.save(user);
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            log.info("Intento de recuperación para email no registrado: {}", email);
            return;
        }

        String token = 
        UUID
        .randomUUID()
        .toString();
        user
        .setPasswordResetToken(token);
        user
        .setPasswordResetTokenExpiresAt(
            java.time.Instant.now()
            .plusSeconds(15 * 60));
        userRepository.save(user);

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendResetPasswordEmail(email, resetLink);
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de restablecimiento inválido o inexistente."));

        if (user.getPasswordResetTokenExpiresAt() == null || 
            user.getPasswordResetTokenExpiresAt().isBefore(java.time.Instant.now())) {
            throw new IllegalArgumentException("El token ha expirado. Por favor solicita uno nuevo.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);
        log.info("Contraseña restablecida exitosamente para el usuario: {}", user.getEmail());
    }

    public void updateUserProfile(String userId, String newEmail, String newPassword) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + userId));

        if (newEmail != null && !newEmail.trim().isEmpty() && !newEmail.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.findByEmail(newEmail).isPresent()) {
                throw new IllegalArgumentException("El correo electrónico ya está registrado por otra cuenta.");
            }
            user.setEmail(newEmail);
        }

        if (newPassword != null && !newPassword.trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        userRepository.save(user);
        log.info("Perfil de usuario [id={}] actualizado correctamente.", userId);
    }
}
