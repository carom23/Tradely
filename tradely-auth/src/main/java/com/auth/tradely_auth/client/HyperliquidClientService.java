package com.auth.tradely_auth.client;

import com.auth.tradely_auth.dto.hyperliquid.HyperliquidExchangeRequest;
import com.auth.tradely_auth.dto.hyperliquid.HyperliquidInfoRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class HyperliquidClientService {

    private final WebClient webClient;

    public HyperliquidClientService(@Qualifier("hyperliquidWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    public <T> Mono<T> postInfo(HyperliquidInfoRequest request, Class<T> responseType) {
        return webClient.post()
                .uri("/info")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(responseType)
                .doOnError(e -> log.error("Error en la llamada a /info de Hyperliquid: {}", e.getMessage()));
    }

    public <T> Mono<T> postExchange(HyperliquidExchangeRequest request, Class<T> responseType) {
        return webClient.post()
                .uri("/exchange")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(responseType)
                .doOnError(e -> log.error("Error en la llamada a /exchange de Hyperliquid: {}", e.getMessage()));
    }

    public Mono<Object> getUserState(String userAddress) {
        HyperliquidInfoRequest req = HyperliquidInfoRequest.builder()
                .type("clearinghouseState")
                .user(userAddress)
                .build();
        
        return postInfo(req, Object.class);
    }

    public Mono<Object> getUserSpotState(String userAddress) {
        HyperliquidInfoRequest req = HyperliquidInfoRequest.builder()
                .type("spotClearinghouseState")
                .user(userAddress)
                .build();
        
        return postInfo(req, Object.class);
    }
    
    public Mono<Object> getMetadata() {
        HyperliquidInfoRequest req = HyperliquidInfoRequest.builder()
                .type("meta")
                .build();
        
        return postInfo(req, Object.class);
    }

    public Mono<Object> getUserFills(String userAddress) {
        HyperliquidInfoRequest req = HyperliquidInfoRequest.builder()
                .type("userFills")
                .user(userAddress)
                .aggregateByTime(true)
                .build();
        
        return postInfo(req, Object.class);
    }

    public Mono<Object> getAllMids() {
        HyperliquidInfoRequest req = HyperliquidInfoRequest.builder()
                .type("allMids")
                .build();
        
        return postInfo(req, Object.class);
    }

    public Mono<Object> getUserPortfolio(String userAddress) {
        HyperliquidInfoRequest req = HyperliquidInfoRequest.builder()
                .type("portfolio")
                .user(userAddress)
                .build();
        
        return postInfo(req, Object.class);
    }
}
