package com.auth.tradely_auth.service;

import com.auth.tradely_auth.entity.User;
import com.auth.tradely_auth.repository.UserRepository;
import com.auth.tradely_auth.service.AuthService;
import com.auth.tradely_auth.service.EmailService;
import com.auth.tradely_auth.service.JwtService;
import com.auth.tradely_auth.client.HyperliquidClientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private EmailService emailService;

    @Mock
    private HyperliquidClientService hyperliquidClientService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                emailService,
                hyperliquidClientService
        );
    }

    @Test
    void forgotPassword_Exito() {
        // Arrange
        String email = "usuario@tradely.com";
        User user = User.builder()
                .id("user-123")
                .email(email)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        // Act
        authService.forgotPassword(email);

        // Assert
        assertNotNull(user.getPasswordResetToken(), "El token de recuperación no debería ser nulo");
        assertNotNull(user.getPasswordResetTokenExpiresAt(), "El tiempo de expiración no debería ser nulo");
        assertTrue(user.getPasswordResetTokenExpiresAt().isAfter(Instant.now()), "La expiración debería ser en el futuro");

        verify(userRepository, times(1)).save(user);
        verify(emailService, times(1)).sendResetPasswordEmail(eq(email), any(String.class));
    }

    @Test
    void forgotPassword_EmailNoRegistrado() {
        // Arrange
        String email = "no_existe@tradely.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act
        authService.forgotPassword(email);

        // Assert
        verify(userRepository, never()).save(any(User.class));
        verify(emailService, never()).sendResetPasswordEmail(anyString(), anyString());
    }

    @Test
    void resetPassword_Exito() {
        // Arrange
        String token = "reset-token-123";
        String rawPassword = "nuevaContrasena123";
        String encodedPassword = "encodedContrasenaHash";

        User user = User.builder()
                .id("user-123")
                .email("usuario@tradely.com")
                .passwordResetToken(token)
                .passwordResetTokenExpiresAt(Instant.now().plusSeconds(600)) // Válido por 10 minutos más
                .build();

        when(userRepository.findByPasswordResetToken(token)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);

        // Act
        authService.resetPassword(token, rawPassword);

        // Assert
        assertEquals(encodedPassword, user.getPasswordHash(), "La contraseña hash debería ser la contraseña codificada");
        assertNull(user.getPasswordResetToken(), "El token debería haberse limpiado");
        assertNull(user.getPasswordResetTokenExpiresAt(), "La fecha de expiración debería haberse limpiado");

        verify(userRepository, times(1)).save(user);
    }

    @Test
    void resetPassword_TokenExpirado() {
        // Arrange
        String token = "reset-token-expired";
        String rawPassword = "nuevaContrasena123";

        User user = User.builder()
                .id("user-123")
                .email("usuario@tradely.com")
                .passwordResetToken(token)
                .passwordResetTokenExpiresAt(Instant.now().minusSeconds(10)) // Expirado hace 10 segundos
                .build();

        when(userRepository.findByPasswordResetToken(token)).thenReturn(Optional.of(user));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            authService.resetPassword(token, rawPassword);
        });

        assertEquals("El token ha expirado. Por favor solicita uno nuevo.", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void resetPassword_TokenInvalido() {
        // Arrange
        String token = "token-inexistente";
        String rawPassword = "nuevaContrasena123";

        when(userRepository.findByPasswordResetToken(token)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            authService.resetPassword(token, rawPassword);
        });

        assertEquals("Token de restablecimiento inválido o inexistente.", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }
}
