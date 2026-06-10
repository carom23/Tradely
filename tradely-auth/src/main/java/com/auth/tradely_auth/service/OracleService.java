package com.auth.tradely_auth.service;

import com.auth.tradely_auth.client.HyperliquidClientService;
import com.auth.tradely_auth.dto.OracleRequestDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class OracleService {

    private final HyperliquidClientService hlClient;
    private final WebClient geminiWebClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public OracleService(
            HyperliquidClientService hlClient,
            @Qualifier("geminiWebClient") WebClient geminiWebClient,
            ObjectMapper objectMapper,
            @Value("${app.gemini.api-key}") String apiKey,
            @Value("${app.gemini.model:gemini-2.5-flash}") String model
    ) {
        this.hlClient = hlClient;
        this.geminiWebClient = geminiWebClient;
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    public String analyzeCoin(OracleRequestDTO request) {
        String coin = request.coin().toUpperCase();
        String address = request.walletAddress().trim().toLowerCase();

        String currentPrice = "N/A";
        try {
            Object midsObj = hlClient.getAllMids().block();
            if (midsObj instanceof Map) {
                Map<String, Object> midsMap = (Map<String, Object>) midsObj;
                if (midsMap.containsKey(coin)) {
                    currentPrice = String.valueOf(midsMap.get(coin));
                }
            }
        } catch (Exception e) {
            log.error("Error fetching current price for {} from Hyperliquid: {}", coin, e.getMessage());
        }

        List<Map<String, Object>> filteredFills = new ArrayList<>();
        try {
            Object fillsObj = hlClient.getUserFills(address).block();
            if (fillsObj instanceof List) {
                List<Object> fillsList = (List<Object>) fillsObj;
                for (Object fill : fillsList) {
                    if (fill instanceof Map) {
                        Map<String, Object> fillMap = (Map<String, Object>) fill;
                        if (coin.equalsIgnoreCase(String.valueOf(fillMap.get("coin")))) {
                            filteredFills.add(fillMap);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error fetching or filtering user fills for {}: {}", address, e.getMessage());
        }

        StringBuilder fillsFormatted = new StringBuilder();
        if (filteredFills.isEmpty()) {
            fillsFormatted.append("El usuario no tiene trades recientes en Hyperliquid para el activo ").append(coin).append(".\n");
        } else {
            int count = 0;
            for (Map<String, Object> fill : filteredFills) {
                if (count >= 10) break;
                String side = "B".equalsIgnoreCase(String.valueOf(fill.get("side"))) ? "COMPRA" : "VENTA";
                fillsFormatted.append(String.format("- Trade: %s | Operación: %s | Tamaño: %s | Precio: $%s | PnL Realizado: $%s | Fee: %s USDC | Timestamp: %s\n",
                        coin, side, fill.get("sz"), fill.get("px"), 
                        fill.getOrDefault("pnl", "0.00"), fill.getOrDefault("fee", "0.00"), fill.get("time")));
                count++;
            }
        }

        String systemInstruction = """
            Eres un oráculo de inversión experto y analista técnico del exchange Hyperliquid.
            Tu tarea es analizar el precio actual de un activo y el historial reciente de trades del usuario
            para proporcionar una recomendación de inversión altamente estructurada y profesional en formato Markdown.
            El análisis debe ser riguroso, realista y redactado de manera premium en ESPAÑOL.
            
            Estructura obligatoria para tu respuesta en Markdown:
            ### 📊 Análisis del Precio Actual
            - **Precio de Mercado Actual:** $[Precio]
            - **Soportes y Resistencias:** [Detalles estimados basados en análisis técnico del activo]
            - **Tendencia de Mercado:** [Alcista / Bajista / Lateral con breve justificación]
            
            ### 📈 Recomendación de Inversión
            - **Recomendación:** [COMPRAR / VENDER / MANTENER]
            - **Justificación:** [Argumentación sólida de al menos 2 párrafos explicando detalladamente el por qué técnico y estratégico]
            
            ### 🛡️ Gestión de Riesgo
            - **Nivel de Riesgo Sugerido:** [Bajo / Medio / Alto]
            - **Stop Loss Estimado:** $[Precio]
            - **Target Price Estimado (Take Profit):** $[Precio]
            """;

        String userPrompt = String.format(
                "Activo a analizar: %s\n" +
                "Precio actual en Hyperliquid: $%s\n" +
                "Historial de trades recientes del usuario:\n%s\n\n" +
                "Por favor, genera tu análisis técnico y recomendación en base a estos datos utilizando la estructura de Markdown definida.",
                coin, currentPrice, fillsFormatted.toString()
        );

        return callGemini(systemInstruction, userPrompt);
    }

    private String callGemini(String systemInstruction, String userPrompt) {
        String path = "/v1beta/models/" + model + ":generateContent";

        Map<String, Object> requestBody = Map.of(
            "system_instruction", Map.of(
                "parts", List.of(Map.of("text", systemInstruction))
            ),
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", userPrompt)))
            ),
            "generationConfig", Map.of(
                "temperature", 0.3,
                "responseMimeType", "text/plain"
            )
        );

        try {
            String responseStr = geminiWebClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path(path)
                            .queryParam("key", apiKey)
                            .build())
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseStr);
            JsonNode textNode = root
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text");

            if (textNode.isMissingNode() || textNode.isNull()) {
                return "Error: La IA de Gemini no pudo generar una recomendación válida.";
            }

            return textNode.asText();

        } catch (Exception e) {
            log.error("Error calling Gemini API for Oracle analysis: {}", e.getMessage());
            return "### Error en el Oráculo de IA\nNo se pudo establecer conexión con el motor de inteligencia artificial. Por favor, asegúrate de que tu clave de Gemini es correcta e inténtalo de nuevo más tarde.";
        }
    }

    public String analyzePortfolio(String walletAddress) {
        if (walletAddress == null || walletAddress.trim().isEmpty()) {
            throw new IllegalArgumentException("Wallet address is required");
        }
        String address = walletAddress.trim().toLowerCase();

        String totalBalance = "0.00";
        String marginUsed = "0.00";
        String accountValue = "0.00";
        StringBuilder positionsFormatted = new StringBuilder();

        try {
            Object stateObj = hlClient.getUserState(address).block();
            if (stateObj instanceof Map) {
                Map<String, Object> stateMap = (Map<String, Object>) stateObj;

                Map<String, Object> marginSummary = (Map<String, Object>) stateMap.get("marginSummary");
                if (marginSummary != null) {
                    if (marginSummary.containsKey("accountValue")) {
                        accountValue = String.valueOf(marginSummary.get("accountValue"));
                    }
                    if (marginSummary.containsKey("totalMarginUsed")) {
                        marginUsed = String.valueOf(marginSummary.get("totalMarginUsed"));
                    } else if (marginSummary.containsKey("maintenanceMargin")) {
                        marginUsed = String.valueOf(marginSummary.get("maintenanceMargin"));
                    }
                }

                List<Object> assetPositions = (List<Object>) stateMap.get("assetPositions");
                if (assetPositions != null && !assetPositions.isEmpty()) {
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
                                    // Ignorar
                                }
                                if (size == 0) continue;
                                String side = size > 0 ? "LONG" : "SHORT";
                                positionsFormatted.append(String.format(
                                    "- %s: %s %.4f | Entrada: $%s | PnL no realizado: $%s\n",
                                    pos.get("coin"), side, Math.abs(size), pos.get("entryPx"), pos.get("unrealizedPnl")
                                ));
                            }
                        }
                    }
                }

                if (positionsFormatted.length() == 0) {
                    positionsFormatted.append("Sin posiciones abiertas.\n");
                }
            }
        } catch (Exception e) {
            log.error("Error fetching clearinghouseState for portfolio analysis: {}", e.getMessage());
        }

        double spotValue = 0.0;
        try {
            Object spotObj = hlClient.getUserSpotState(address).block();
            if (spotObj instanceof Map) {
                Map<String, Object> spotMap = (Map<String, Object>) spotObj;
                List<Object> balances = (List<Object>) spotMap.get("balances");
                if (balances != null) {
                    for (Object b : balances) {
                        if (b instanceof Map) {
                            Map<String, Object> bal = (Map<String, Object>) b;
                            if (bal.containsKey("total")) {
                                try {
                                    double tokenTotal = Double.parseDouble(String.valueOf(bal.get("total")));
                                    if (tokenTotal > 0) {
                                        spotValue += tokenTotal;
                                    }
                                } catch (Exception ex) {
                                    // Ignorar
                                }
                            }
                        }
                    }
                }
            }
            totalBalance = String.format(java.util.Locale.US, "%.2f", spotValue);
        } catch (Exception e) {
            log.error("Error fetching spotState for portfolio analysis: {}", e.getMessage());
        }

        double totalBalanceVal = 0.0;
        double accountValueVal = 0.0;
        double marginUsedVal = 0.0;

        try { totalBalanceVal = Double.parseDouble(totalBalance); } catch (Exception ignored) {}
        try { accountValueVal = Double.parseDouble(accountValue); } catch (Exception ignored) {}
        try { marginUsedVal = Double.parseDouble(marginUsed); } catch (Exception ignored) {}

        double combinedBalance = accountValueVal + totalBalanceVal;
        double marginUsagePct = combinedBalance > 0 ? (marginUsedVal / combinedBalance) * 100.0 : 0.0;

        String systemInstruction = """
            Eres un analista de riesgo experto en trading de derivados perpetuos en la blockchain L1 Hyperliquid.
            Tu tarea es analizar el estado actual de la cuenta del usuario y generar un informe conciso de salud del portfolio.
            Responde SIEMPRE en español, de forma directa y profesional.
            Utiliza exactamente esta estructura Markdown (sin añadir secciones extra):

            ### 💼 Estado del Portfolio
            - **Patrimonio total (USDC):** [valor]
            - **Margen en perps:** [valor]
            - **Uso de margen:** [porcentaje]% → [Bajo (<30%) / Moderado (30–60%) / Alto (>60%)]

            ### ✅ Puntos Fuertes
            - [punto 1]
            - [punto 2]

            ### ⚠️ Riesgos Detectados
            - [riesgo 1]
            - [riesgo 2]

            ### 💡 Recomendación
            [Una frase de recomendación concreta, no ejecutiva: qué vigilar o considerar, sin decir qué hacer]
            """;

        String userPrompt = String.format(
            "Patrimonio total USDC (spot): $%s%n" +
            "Margen en perps (accountValue): $%s%n" +
            "Margen utilizado: $%s (%.1f%% del patrimonio total)%n" +
            "Posiciones abiertas:%n%s",
            totalBalance, accountValue, marginUsed, marginUsagePct, positionsFormatted.toString()
        );

        return callGemini(systemInstruction, userPrompt);
    }
}
