package com.auth.tradely_auth.job;

import com.auth.tradely_auth.client.HyperliquidClientService;
import com.auth.tradely_auth.entity.AccountValueSnapshot;
import com.auth.tradely_auth.entity.User;
import com.auth.tradely_auth.repository.AccountValueSnapshotRepository;
import com.auth.tradely_auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccountValueSnapshotJob {

    private final UserRepository userRepository;
    private final AccountValueSnapshotRepository snapshotRepository;
    private final HyperliquidClientService hlClient;

    /**
     * CLASE DE PRUEBA NO ESTA ACTIVA
     * tarea programada para capturar el Account Value histórico de cada usuario
     * se ejecuta cada 5 minutos 
     */
    // @Scheduled(fixedDelay = 300000)
    public void captureAccountValues() {
        log.info("Iniciando captura programada de Account Value...");

        List<User> users = userRepository.findByHlWalletAddressIsNotNull();
        if (users.isEmpty()) {
            log.info("No hay usuarios con wallet registrada para capturar.");
            return;
        }

        for (User user : users) {
            String wallet = user.getHlWalletAddress();
            if (wallet == null || wallet.trim().isEmpty() || "NONE".equalsIgnoreCase(wallet.trim())) {
                continue;
            }

            String cleanWallet = wallet.trim().toLowerCase();
            try {
                captureUserSnapshot(cleanWallet);
            } catch (Exception e) {
                log.error("Error al capturar snapshot de Account Value para la wallet {}: {}", cleanWallet, e.getMessage());
            }
        }

        log.info("Captura de Account Value completada.");
    }

    private void captureUserSnapshot(String wallet) {
        log.debug("Capturando snapshot para la wallet: {}", wallet);

        double perpValue = 0.0;
        try {
            Object perpState = hlClient.getUserState(wallet).block();
            if (perpState instanceof Map) {
                Map<String, Object> stateMap = (Map<String, Object>) perpState;
                Map<String, Object> marginSummary = (Map<String, Object>) stateMap.get("marginSummary");
                if (marginSummary != null && marginSummary.containsKey("accountValue")) {
                    perpValue = Double.parseDouble(String.valueOf(marginSummary.get("accountValue")));
                }
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener el estado de perps para {}: {}", wallet, e.getMessage());
        }

        double spotValue = 0.0;
        try {
            Object spotState = hlClient.getUserSpotState(wallet).block();
            if (spotState instanceof Map) {
                Map<String, Object> spotMap = (Map<String, Object>) spotState;
                if (spotMap.containsKey("balances")) {
                    Object balancesObj = spotMap.get("balances");
                    if (balancesObj instanceof List) {
                        List<Object> balancesList = (List<Object>) balancesObj;
                        for (Object balanceItem : balancesList) {
                            if (balanceItem instanceof Map) {
                                Map<String, Object> balMap = (Map<String, Object>) balanceItem;
                                
                                if (balMap.containsKey("entryNtl")) {
                                    spotValue += Double.parseDouble(String.valueOf(balMap.get("entryNtl")));
                                } else if (balMap.containsKey("total") && "USDC".equalsIgnoreCase(String.valueOf(balMap.get("coin")))) {
                                    spotValue += Double.parseDouble(String.valueOf(balMap.get("total")));
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener el estado spot para {}: {}", wallet, e.getMessage());
        }

        double totalAccountValue = perpValue + spotValue;

        AccountValueSnapshot snapshot = AccountValueSnapshot.builder()
                .walletAddress(wallet)
                .accountValue(BigDecimal.valueOf(totalAccountValue))
                .capturedAt(Instant.now())
                .build();

        snapshotRepository.save(snapshot);
        log.info("Snapshot guardado para {}: Perp = {}, Spot = {}, Total = {}", wallet, perpValue, spotValue, totalAccountValue);
    }
}
