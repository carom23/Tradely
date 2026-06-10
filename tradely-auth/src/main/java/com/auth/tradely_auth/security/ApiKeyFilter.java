package com.auth.tradely_auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Filtro de seguridad para n8n basado en API Key estática.
 * Valida la cabecera X-API-KEY y otorga el rol ROLE_AGENT.
 */
@Component
public class ApiKeyFilter extends OncePerRequestFilter {

    @Value("${app.agent.api-key}")
    private String agentApiKey;

    private boolean isAgentPath(String path) {
        return path.equals("/api/v1/alerts/active-all") 
            || path.equals("/api/v1/alerts/send-notification")
            || (path.startsWith("/api/v1/alerts/") && path.endsWith("/notify"));
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return !isAgentPath(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();
        if (isAgentPath(path)) {
            String apiKey = request.getHeader("X-API-KEY");

            if (agentApiKey == null || !agentApiKey.equals(apiKey)) {
                //respuesta 401 Unauthorized en formato JSON según requerimiento
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"error\": \"Invalid or missing API Key\"}");
                return;
            }

            //autenticación con rol ROLE_AGENT
            var auth = new PreAuthenticatedAuthenticationToken(
                "n8n-agent", 
                null, 
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_AGENT"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
