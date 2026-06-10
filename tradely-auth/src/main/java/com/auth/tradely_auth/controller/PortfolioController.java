package com.auth.tradely_auth.controller;

import com.auth.tradely_auth.dto.PortfolioResponseDTO;
import com.auth.tradely_auth.dto.PortfolioHistoryPointDTO;
import com.auth.tradely_auth.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping("/{walletAddress}")
    public ResponseEntity<PortfolioResponseDTO> getPortfolio(@PathVariable String walletAddress) {
        return ResponseEntity.ok(portfolioService.getPortfolio(walletAddress));
    }

    @GetMapping("/history")
    public ResponseEntity<List<PortfolioHistoryPointDTO>> getPortfolioHistory(
            @RequestParam String address,
            @RequestParam(defaultValue = "7d") String period) {
        return ResponseEntity.ok(portfolioService.getPortfolioHistory(address, period));
    }
}
