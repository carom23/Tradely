package com.auth.tradely_auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class HyperliquidWebClientConfig {

    @Value("${hyperliquid.api.url:https://api.hyperliquid.xyz}")
    private String hyperliquidApiUrl;

    @Bean(name = "hyperliquidWebClient")
    public WebClient hyperliquidWebClient() {
        return WebClient.builder()
                .baseUrl(hyperliquidApiUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
