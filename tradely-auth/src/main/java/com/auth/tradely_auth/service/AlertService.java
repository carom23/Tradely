package com.auth.tradely_auth.service;

import com.auth.tradely_auth.entity.AlertScope;
import com.auth.tradely_auth.entity.AlertMetric;
import com.auth.tradely_auth.dto.AlertRequestDTO;
import com.auth.tradely_auth.dto.AlertResponseDTO;
import com.auth.tradely_auth.entity.Alert;
import com.auth.tradely_auth.entity.User;
import com.auth.tradely_auth.repository.AlertRepository;
import com.auth.tradely_auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public AlertResponseDTO createAlert(String userId, AlertRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + userId));

        Alert alert = Alert.builder()
                .user(user)
                .scope(request.scope())
                .metric(request.metric())
                .coin(request.coin() != null ? request.coin().toUpperCase().trim() : null)
                .direction(request.direction() != null ? request.direction().toUpperCase().trim() : null)
                .email(request.email().trim())
                .type(request.type())
                .threshold(request.threshold())
                .active(true)
                .emailNotified(false)
                .build();

        Alert saved = alertRepository.save(alert);
        log.info("Alerta creada [id={}] para usuario [id={}] | Scope={} Metric={} Coin={} Threshold={}",
                saved.getId(), userId, saved.getScope(), saved.getMetric(), saved.getCoin(), saved.getThreshold());

        return AlertResponseDTO.from(saved);
    }

    public List<AlertResponseDTO> getAlertsByUserId(String userId) {
        return alertRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(AlertResponseDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteAlert(UUID alertId, String userId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alerta no encontrada: " + alertId));

        if (!alert.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("No tienes permisos sobre esta alerta");
        }

        alertRepository.delete(alert);
        log.info("Alerta de precio eliminada [id={}] por usuario [id={}]", alertId, userId);
    }

    @Transactional
    public AlertResponseDTO toggleAlert(UUID alertId, String userId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alerta no encontrada: " + alertId));

        if (!alert.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("No tienes permisos sobre esta alerta");
        }

        alert.setActive(!alert.isActive());
        // Al reactivar, reseteamos la notificación por correo para que pueda dispararse de nuevo
        if (alert.isActive()) {
            alert.setEmailNotified(false);
        }

        Alert updated = alertRepository.save(alert);
        log.info("Alerta [id={}] toggled | active={}", alertId, updated.isActive());

        return AlertResponseDTO.from(updated);
    }

    public List<AlertResponseDTO> getActiveAlertsForAgent() {
        return alertRepository.findByActiveTrueAndEmailNotifiedFalse()
                .stream()
                .map(AlertResponseDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlertResponseDTO markAlertAsNotified(UUID alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alerta no encontrada: " + alertId));

        alert.setEmailNotified(true);
        Alert updated = alertRepository.save(alert);
        log.info("Alerta [id={}] marcada como notificada por email", alertId);

        return AlertResponseDTO.from(updated);
    }

    @Transactional
    public AlertResponseDTO sendAlertNotification(UUID alertId, String metric, String coin, String alertType,
                                                   double threshold, double currentValue, String userEmail) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alerta no encontrada: " + alertId));

        emailService.sendAlertEmail(userEmail, metric, coin, alertType, threshold, currentValue);

        alert.setEmailNotified(true);
        Alert updated = alertRepository.save(alert);
        log.info("Alerta [id={}] de métrica {} notificada por email a {} y marcada como notificada", alertId, metric, userEmail);

        return AlertResponseDTO.from(updated);
    }
}
