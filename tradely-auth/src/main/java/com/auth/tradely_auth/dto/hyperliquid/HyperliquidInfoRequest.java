package com.auth.tradely_auth.dto.hyperliquid;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HyperliquidInfoRequest {
    private String type;
    private String user;
    private Boolean aggregateByTime;
}
