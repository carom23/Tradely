package com.auth.tradely_auth.controller;

import com.auth.tradely_auth.dto.UpdateUserWalletsRequest;
import com.auth.tradely_auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;
    private final com.auth.tradely_auth.client.HyperliquidClientService hlClient;

    @PostMapping("/wallets")
    public ResponseEntity<String> updateWallets(
            @RequestBody UpdateUserWalletsRequest request,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            authService.updateUserWallets(principal.getName(), request.hlWalletAddress());
            return ResponseEntity.ok("User wallets updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/profile")
    public ResponseEntity<?> updateUserProfile(
            @RequestBody java.util.Map<String, String> body,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            String email = body.get("email");
            String password = body.get("password");
            authService.updateUserProfile(principal.getName(), email, password);
            return ResponseEntity.ok(java.util.Map.of("message", "Perfil de usuario actualizado correctamente."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/users/balances
     * retorna los balances de margen en tiempo real de Hyperliquid L1 para la wallet del usuario
     */
    @GetMapping("/balances")
    public ResponseEntity<?> getUserBalances(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            com.auth.tradely_auth.entity.User user = authService.getUserByIdentifier(principal.getName());
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            

            String accountValue = "0.00";
            String maintenanceMargin = "0.00";
            String effectiveLeverage = "1.00x";
            
            String queryAddress = user.getHlWalletAddress();
            
            double perpAccountValue = 0.0;
            double spotUsdcTotal = 0.0;

            if (queryAddress != null && !queryAddress.trim().isEmpty()) {
                queryAddress = queryAddress.trim().toLowerCase(); 
                
                try {
                    Object state = hlClient.getUserState(queryAddress).block();
                    if (state instanceof java.util.Map) {
                        java.util.Map<?, ?> stateMap = (java.util.Map<?, ?>) state;
                        java.util.Map<?, ?> marginSummary = (java.util.Map<?, ?>) stateMap.get("marginSummary");
                        if (marginSummary != null) {
                            if (marginSummary.containsKey("accountValue")) {
                                perpAccountValue = Double.parseDouble(String.valueOf(marginSummary.get("accountValue")));
                                accountValue = String.format(java.util.Locale.US, "%.2f", perpAccountValue);
                            }
                            if (marginSummary.containsKey("maintenanceMargin")) {
                                double rawMaint = Double.parseDouble(String.valueOf(marginSummary.get("maintenanceMargin")));
                                maintenanceMargin = String.format(java.util.Locale.US, "%.2f", rawMaint);
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error al obtener clearinghouseState de Hyperliquid L1: " + e.getMessage());
                }

                try {
                    Object spotState = hlClient.getUserSpotState(queryAddress).block();
                    if (spotState instanceof java.util.Map) {
                        java.util.Map<?, ?> spotStateMap = (java.util.Map<?, ?>) spotState;
                        Object balancesObj = spotStateMap.get("balances");
                        if (balancesObj instanceof java.util.List) {
                            java.util.List<?> balancesList = (java.util.List<?>) balancesObj;
                            for (Object balanceObj : balancesList) {
                                if (balanceObj instanceof java.util.Map) {
                                    java.util.Map<?, ?> balanceMap = (java.util.Map<?, ?>) balanceObj;
                                    String coin = String.valueOf(balanceMap.get("coin"));
                                    if ("USDC".equalsIgnoreCase(coin)) {
                                        spotUsdcTotal = Double.parseDouble(String.valueOf(balanceMap.get("total")));
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error al obtener spotClearinghouseState de Hyperliquid L1: " + e.getMessage());
                }
            }
            
            String spotBalanceStr = String.format(java.util.Locale.US, "%.2f", spotUsdcTotal);
            String totalBalanceStr = String.format(java.util.Locale.US, "%.2f", perpAccountValue + spotUsdcTotal);

            response.put("accountValue", accountValue);
            response.put("spotBalance", spotBalanceStr);
            response.put("total", totalBalanceStr);
            response.put("maintenanceMargin", maintenanceMargin);
            response.put("effectiveLeverage", effectiveLeverage);
            response.put("masterWallet", user.getHlWalletAddress() != null ? user.getHlWalletAddress() : "NONE");
            
            java.util.List<java.util.Map<String, Object>> assetList = new java.util.ArrayList<>();
            
            java.util.Map<String, Object> usdc = new java.util.HashMap<>();
            usdc.put("name", "USD Coin");
            usdc.put("symbol", "USDC");
            usdc.put("balance", totalBalanceStr);
            usdc.put("value", "$" + totalBalanceStr);
            usdc.put("allocation", "100.0%");
            assetList.add(usdc);
            
            response.put("assets", assetList);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
