package com.auth.tradely_auth.controller;

import com.auth.tradely_auth.dto.OracleRequestDTO;
import com.auth.tradely_auth.service.OracleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/oracle")
@RequiredArgsConstructor
public class OracleController {

    private final OracleService oracleService;

    @PostMapping("/analyze")
    public ResponseEntity<String> analyzeCoin(@RequestBody OracleRequestDTO request) {
        String analysis = oracleService.analyzeCoin(request);
        return ResponseEntity.ok(analysis);
    }

    @PostMapping("/portfolio-summary")
    public ResponseEntity<java.util.Map<String, String>> getPortfolioSummary(@RequestParam String wallet) {
        if (wallet == null || wallet.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Wallet requerida"));
        }
        String analysis = oracleService.analyzePortfolio(wallet);
        return ResponseEntity.ok(java.util.Map.of("analysis", analysis));
    }
}
