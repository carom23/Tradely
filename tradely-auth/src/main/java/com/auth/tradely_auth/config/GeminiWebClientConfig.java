package com.auth.tradely_auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Configura el WebClient dedicado a la API de Google Gemini
 * Se separa del WebClient genérico para poder configurar
 * la base URL y cabeceras específicas de Gemini de forma aislada
 */
@Configuration
public class GeminiWebClientConfig {

    @Bean("geminiWebClient")
    public WebClient geminiWebClient(
            @Value("${app.gemini.base-url}") String baseUrl) {

        return WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
