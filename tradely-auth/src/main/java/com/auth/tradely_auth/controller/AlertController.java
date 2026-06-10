package com.auth.tradely_auth.controller;

import com.auth.tradely_auth.dto.AlertRequestDTO;
import com.auth.tradely_auth.dto.AlertResponseDTO;
import com.auth.tradely_auth.service.AlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    //Endpoints de Usuario JWT Autenticado

    @GetMapping
    public ResponseEntity<List<AlertResponseDTO>> getUserAlerts() {
        String userId = getAuthenticatedUserId();
        return ResponseEntity.ok(alertService.getAlertsByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<AlertResponseDTO> createAlert(@Valid @RequestBody AlertRequestDTO request) {
        String userId = getAuthenticatedUserId();
        AlertResponseDTO response = alertService.createAlert(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlert(@PathVariable UUID id) {
        String userId = getAuthenticatedUserId();
        alertService.deleteAlert(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<AlertResponseDTO> toggleAlert(@PathVariable UUID id) {
        String userId = getAuthenticatedUserId();
        return ResponseEntity.ok(alertService.toggleAlert(id, userId));
    }

    //Endpoints del Agente / N8N (API Key Autenticado)

    @GetMapping("/active-all")
    public ResponseEntity<List<AlertResponseDTO>> getActiveAlertsForAgent() {
        return ResponseEntity.ok(alertService.getActiveAlertsForAgent());
    }

    @PatchMapping("/{id}/notify")
    public ResponseEntity<AlertResponseDTO> markAlertAsNotified(@PathVariable UUID id) {
        return ResponseEntity.ok(alertService.markAlertAsNotified(id));
    }

    @PostMapping("/send-notification")
    public ResponseEntity<?> sendAlertNotification(@RequestBody java.util.Map<String, Object> request) {
        try {
            UUID id = UUID.fromString((String) request.get("id"));
            String metric = (String) request.get("metric");
            String coin = (String) request.get("coin");
            String type = (String) request.get("type");
            double threshold = ((Number) request.get("threshold")).doubleValue();
            double currentValue = ((Number) request.get("currentValue")).doubleValue();
            String userEmail = (String) request.get("userEmail");

            AlertResponseDTO response = alertService.sendAlertNotification(id, metric, coin, type, threshold, currentValue, userEmail);
            return ResponseEntity.ok(java.util.Map.of("message", "Notificación enviada correctamente", "alert", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }


    private String getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (String) auth.getPrincipal();
    }
}
