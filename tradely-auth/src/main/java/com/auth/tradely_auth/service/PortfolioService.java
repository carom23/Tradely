package com.auth.tradely_auth.service;

import com.auth.tradely_auth.client.HyperliquidClientService;
import com.auth.tradely_auth.dto.PortfolioResponseDTO;
import com.auth.tradely_auth.dto.PortfolioHistoryPointDTO;
import com.auth.tradely_auth.entity.AccountValueSnapshot;
import com.auth.tradely_auth.repository.AccountValueSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final HyperliquidClientService hlClient;
    private final AccountValueSnapshotRepository snapshotRepository;

    public PortfolioResponseDTO getPortfolio(String walletAddress) {
        if (walletAddress == null || walletAddress.trim().isEmpty()) {
            throw new IllegalArgumentException("Wallet address is required");
        }
        
        String cleanAddress = walletAddress.trim().toLowerCase();
        
        Map<String, Object> stateMap = null;
        try {
            Object stateObj = hlClient.getUserState(cleanAddress).block();
            if (stateObj instanceof Map) {
                stateMap = (Map<String, Object>) stateObj;
            }
        } catch (Exception e) {
            log.error("Error fetching clearinghouseState for {}: {}", cleanAddress, e.getMessage());
        }

        List<Object> fillsList = null;
        try {
            Object fillsObj = hlClient.getUserFills(cleanAddress).block();
            if (fillsObj instanceof List) {
                fillsList = (List<Object>) fillsObj;
            }
        } catch (Exception e) {
            log.error("Error fetching userFills for {}: {}", cleanAddress, e.getMessage());
        }

        Map<String, Object> spotStateMap = null;
        try {
            Object spotObj = hlClient.getUserSpotState(cleanAddress).block();
            if (spotObj instanceof Map) {
                spotStateMap = (Map<String, Object>) spotObj;
            }
        } catch (Exception e) {
            log.error("Error fetching spotClearinghouseState for {}: {}", cleanAddress, e.getMessage());
        }

        String totalBalance = "0.00";
        String totalPnlStr = "0.00";
        double totalPnlVal = 0.0;
        List<PortfolioResponseDTO.PositionDTO> positions = new ArrayList<>();
        
        double maxNtl = 0.0;
        String maxCoin = "Ninguno";
        double sumNtl = 0.0;

        double maxLeverageValue = 1.0;
        Map<String, Double> coinValues = new HashMap<>();

        if (stateMap != null) {
            Map<String, Object> marginSummary = (Map<String, Object>) stateMap.get("marginSummary");
            if (marginSummary != null && marginSummary.containsKey("accountValue")) {
                totalBalance = String.format(java.util.Locale.US, "%.2f", Double.parseDouble(String.valueOf(marginSummary.get("accountValue"))));
            }

            List<Object> assetPositions = (List<Object>) stateMap.get("assetPositions");
            if (assetPositions != null) {
                for (Object item : assetPositions) {
                    if (item instanceof Map) {
                        Map<String, Object> itemMap = (Map<String, Object>) item;
                        Map<String, Object> pos = (Map<String, Object>) itemMap.get("position");
                        if (pos != null) {
                            double size = 0.0;
                            try {
                                if (pos.containsKey("szi")) {
                                    size = Double.parseDouble(String.valueOf(pos.get("szi")));
                                } else if (pos.containsKey("sentry")) {
                            
                                    size = Double.parseDouble(String.valueOf(pos.get("sentry")));
                                }
                            } catch (Exception e) {
                                log.warn("Error parsing position size for wallet {}: {}", cleanAddress, e.getMessage());
                            }

                            if (size == 0) {
                                continue;
                            }

                            String coin = String.valueOf(pos.get("coin"));
                            double entryPx = Double.parseDouble(String.valueOf(pos.get("entryPx")));
                            double unrealizedPnl = Double.parseDouble(String.valueOf(pos.get("unrealizedPnl")));
                            totalPnlVal += unrealizedPnl;

                            String direction = size > 0 ? "LONG" : "SHORT";
                            double absSize = Math.abs(size);

                            double currentPx = entryPx;
                            if (absSize > 0) {
                                currentPx = direction.equals("LONG") ? entryPx + (unrealizedPnl / absSize) : entryPx - (unrealizedPnl / absSize);
                            }

                            // Notional value para concentración de riesgo
                            double ntl = absSize * currentPx;
                            sumNtl += ntl;
                            if (ntl > maxNtl) {
                                maxNtl = ntl;
                                maxCoin = coin;
                            }

                            coinValues.put(coin, coinValues.getOrDefault(coin, 0.0) + ntl);

                            double posLeverage = 1.0;
                            if (pos.containsKey("leverage")) {
                                Object leverageObj = pos.get("leverage");
                                if (leverageObj instanceof Map) {
                                    Map<String, Object> leverageMap = (Map<String, Object>) leverageObj;
                                    if (leverageMap.containsKey("value")) {
                                        posLeverage = Double.parseDouble(String.valueOf(leverageMap.get("value")));
                                    }
                                }
                            }
                            if (posLeverage > maxLeverageValue) {
                                maxLeverageValue = posLeverage;
                            }

                            String levStr = String.format(java.util.Locale.US, "%.1fx", posLeverage);
                            String liqPxStr = "N/A";
                            if (pos.containsKey("liquidationPx") && pos.get("liquidationPx") != null) {
                                try {
                                    double liqPx = Double.parseDouble(String.valueOf(pos.get("liquidationPx")));
                                    if (liqPx > 0) {
                                        liqPxStr = String.format(java.util.Locale.US, "%.2f", liqPx);
                                    }
                                } catch (Exception ex) {
                                    // Ignorar
                                }
                            }

                            positions.add(new PortfolioResponseDTO.PositionDTO(
                                coin,
                                String.format(java.util.Locale.US, "%.4f", absSize),
                                String.format(java.util.Locale.US, "%.2f", entryPx),
                                String.format(java.util.Locale.US, "%.2f", currentPx),
                                String.format(java.util.Locale.US, "%+.2f", unrealizedPnl),
                                direction,
                                levStr,
                                liqPxStr
                            ));
                        }
                    }
                }
            }
            totalPnlStr = String.format(java.util.Locale.US, "%+.2f", totalPnlVal);
        }

        double spotValue = 0.0;
        String withdrawableUsdc = "0.00";
        if (spotStateMap != null) {
            if (spotStateMap.containsKey("balances")) {
                Object balancesObj = spotStateMap.get("balances");
                if (balancesObj instanceof List) {
                    List<Object> balancesList = (List<Object>) balancesObj;
                    for (Object b : balancesList) {
                        if (b instanceof Map) {
                            Map<String, Object> bMap = (Map<String, Object>) b;
                            if (bMap.containsKey("total")) {
                                try {
                                    double tokenTotal = Double.parseDouble(String.valueOf(bMap.get("total")));
                                    if (tokenTotal > 0) {
                                        spotValue += tokenTotal;
                                        String coin = String.valueOf(bMap.get("coin"));
                                        coinValues.put(coin, coinValues.getOrDefault(coin, 0.0) + tokenTotal);
                                    }
                                } catch (Exception ex) {
                                    // Ignorar
                                }
                            }
                        }
                    }
                }
            }

            if (spotStateMap.containsKey("tokenToAvailableAfterMaintenance")) {
                Object tokenAvailObj = spotStateMap.get("tokenToAvailableAfterMaintenance");
                if (tokenAvailObj instanceof List) {
                    List<Object> outerList = (List<Object>) tokenAvailObj;
                    if (!outerList.isEmpty()) {
                        Object firstItemObj = outerList.get(0);
                        if (firstItemObj instanceof List) {
                            List<Object> innerList = (List<Object>) firstItemObj;
                            if (innerList.size() > 1) {
                                try {
                                    withdrawableUsdc = String.format(java.util.Locale.US, "%.2f", Double.parseDouble(String.valueOf(innerList.get(1))));
                                } catch (Exception ex) {
                                    // Ignorar
                                }
                            }
                        }
                    }
                }
            }
        }

        double perpAccountVal = Double.parseDouble(totalBalance);
        double patrimonioTotalVal = spotValue > 0 ? spotValue : perpAccountVal; 
        String totalBalanceStr = String.format(java.util.Locale.US, "%.2f", patrimonioTotalVal);

        if (spotValue > 0) {
            coinValues.put("USDC", spotValue);
        } else if (perpAccountVal > 0) {
            coinValues.put("USDC", perpAccountVal);
        }

        Map<String, String> coinDistribution = new HashMap<>();
        double grandTotal = 0.0;
        for (double val : coinValues.values()) {
            grandTotal += val;
        }
        if (grandTotal > 0) {
            for (Map.Entry<String, Double> entry : coinValues.entrySet()) {
                double pct = (entry.getValue() / grandTotal) * 100.0;
                coinDistribution.put(entry.getKey(), String.format(java.util.Locale.US, "%.1f%%", pct));
            }
        } else {
            coinDistribution.put("USDC", "100.0%");
        }

        double totalMarginUsed = 0.0;
        if (stateMap != null && positions != null && !positions.isEmpty()) {
            Map<String, Object> marginSummary = (Map<String, Object>) stateMap.get("marginSummary");
            if (marginSummary != null) {
                try {
                    if (marginSummary.containsKey("totalMarginUsed")) {
                        totalMarginUsed = Double.parseDouble(String.valueOf(marginSummary.get("totalMarginUsed")));
                    } else if (marginSummary.containsKey("maintenanceMargin")) {
                        totalMarginUsed = Double.parseDouble(String.valueOf(marginSummary.get("maintenanceMargin")));
                    }
                } catch (Exception ex) {
                    log.warn("Error parseando margen {}: {}", cleanAddress, ex.getMessage());
                }
            }
        }

        double marginUsagePercent = 0.0;
        if (patrimonioTotalVal > 0) {
            marginUsagePercent = (totalMarginUsed / patrimonioTotalVal) * 100.0;
        }
        String marginUsage = String.format(java.util.Locale.US, "%.1f%%", marginUsagePercent);

        String liquidationRisk = "BAJO";
        if (marginUsagePercent >= 45.0) {
            liquidationRisk = "ALTO";
        } else if (marginUsagePercent >= 15.0) {
            liquidationRisk = "MEDIO";
        }

        String riskConcentration = "Ninguna";
        if (sumNtl > 0) {
            double concPercent = (maxNtl / sumNtl) * 100.0;
            riskConcentration = String.format(java.util.Locale.US, "%s-PERP (%.1f%%)", maxCoin, concPercent);
        }

        List<PortfolioResponseDTO.TradeDTO> trades = new ArrayList<>();
        if (fillsList != null) {
            for (Object fillObj : fillsList) {
                if (fillObj instanceof Map) {
                    Map<String, Object> fill = (Map<String, Object>) fillObj;
                    String coin = String.valueOf(fill.get("coin"));
                    double price = Double.parseDouble(String.valueOf(fill.get("px")));
                    double size = Double.parseDouble(String.valueOf(fill.get("sz")));
                    String sideRaw = String.valueOf(fill.get("side"));
                    String side = "B".equalsIgnoreCase(sideRaw) ? "BUY" : "SELL";
                    long timestamp = Long.parseLong(String.valueOf(fill.get("time")));
                    
                    double realizedPnl = 0.0;
                    if (fill.containsKey("pnl")) {
                        realizedPnl = Double.parseDouble(String.valueOf(fill.get("pnl")));
                    }
                    
                    double fee = 0.0;
                    if (fill.containsKey("fee")) {
                        fee = Double.parseDouble(String.valueOf(fill.get("fee")));
                    }

                    trades.add(new PortfolioResponseDTO.TradeDTO(
                        timestamp,
                        coin,
                        String.format(java.util.Locale.US, "%.4f", size),
                        String.format(java.util.Locale.US, "%.2f", price),
                        side,
                        String.format(java.util.Locale.US, "%+.2f", realizedPnl),
                        String.format(java.util.Locale.US, "%.6f", fee)
                    ));
                }
            }
        }

        return new PortfolioResponseDTO(
            totalBalanceStr,
            totalPnlStr,
            withdrawableUsdc,
            marginUsage,
            liquidationRisk,
            riskConcentration,
            String.format(java.util.Locale.US, "%.2f", totalMarginUsed),
            String.format(java.util.Locale.US, "%.2f", perpAccountVal),
            String.format(java.util.Locale.US, "%.1fx", maxLeverageValue),
            coinDistribution,
            positions,
            trades
        );    }

    public List<PortfolioHistoryPointDTO> getPortfolioHistory(String walletAddress, String period) {
        if (walletAddress == null || walletAddress.trim().isEmpty()) {
            throw new IllegalArgumentException("Wallet address is required");
        }
        
        String cleanAddress = walletAddress.trim().toLowerCase();
        
        Object portfolioObj;
        try {
            portfolioObj = hlClient.getUserPortfolio(cleanAddress).block();
        } catch (Exception e) {
            log.error("Error fetching userPortfolio for {}: {}", cleanAddress, e.getMessage());
            return new ArrayList<>();
        }
        
        if (!(portfolioObj instanceof List)) {
            log.warn("Expected List for userPortfolio response, but got: {}", 
                     portfolioObj != null ? portfolioObj.getClass().getName() : "null");
            return new ArrayList<>();
        }
        
        List<Object> periodsArray = (List<Object>) portfolioObj;
        
        String targetName = "week";
        if ("24h".equalsIgnoreCase(period)) {
            targetName = "day";
        } else if ("7d".equalsIgnoreCase(period)) {
            targetName = "week";
        } else if ("30d".equalsIgnoreCase(period)) {
            targetName = "month";
        } else if ("all".equalsIgnoreCase(period)) {
            targetName = "allTime";
        }
        
        List<PortfolioHistoryPointDTO> points = new ArrayList<>();
        boolean periodFound = false;
        
        for (Object periodEntryObj : periodsArray) {
            if (periodEntryObj instanceof List) {
                List<?> periodEntry = (List<?>) periodEntryObj;
                if (periodEntry.size() >= 2) {
                    String name = String.valueOf(periodEntry.get(0));
                    if (name.equalsIgnoreCase(targetName)) {
                        periodFound = true;
                        Object dataObj = periodEntry.get(1);
                        if (dataObj instanceof Map) {
                            Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                            Object historyObj = dataMap.get("accountValueHistory");
                            if (historyObj instanceof List) {
                                List<?> historyList = (List<?>) historyObj;
                                for (Object pointObj : historyList) {
                                    if (pointObj instanceof List) {
                                        List<?> point = (List<?>) pointObj;
                                        if (point.size() >= 2) {
                                            try {
                                                long time = Long.parseLong(String.valueOf(point.get(0)));
                                                double value = Double.parseDouble(String.valueOf(point.get(1)));
                                                points.add(new PortfolioHistoryPointDTO(time, value));
                                            } catch (Exception ex) {
                                                log.warn("Error parseando histroial de portfolio para wallet{}: {}", cleanAddress, ex.getMessage());
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
        
        if (!periodFound) {
            log.warn("no encontro el periodo {} para la wallet {}", targetName, cleanAddress);
        }
        
        return points;
    }
}
