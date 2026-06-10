package com.auth.tradely_auth.dto.hyperliquid;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HyperliquidExchangeRequest {
    private Object action;
    private Long nonce;
    private L1Signature signature;
    private String vaultAddress;

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class L1Signature {
        private String r;
        private String s;
        private Integer v;
    }
}
