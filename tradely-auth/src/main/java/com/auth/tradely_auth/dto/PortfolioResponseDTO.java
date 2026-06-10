package com.auth.tradely_auth.dto;

import java.util.List;
import java.util.Map;

public record PortfolioResponseDTO(
    String totalBalance,
    String totalPnl,
    String withdrawableUsdc,
    String marginUsage,
    String liquidationRisk,
    String riskConcentration,
    String marginUsed,
    String accountValue,
    String maxLeverage,
    Map<String, String> coinDistribution,
    List<PositionDTO> positions,
    List<TradeDTO> trades
) {
    public record PositionDTO(
        String coin,
        String size,
        String entryPrice,
        String currentPrice,
        String unrealizedPnl,
        String direction, // "LONG" o "SHORT"
        String leverage,
        String liquidationPrice
    ) {}

    public record TradeDTO(
        long timestamp,
        String coin,
        String size,
        String price,
        String side, // "BUY" o "SELL"
        String realizedPnl,
        String fee
    ) {}
}
