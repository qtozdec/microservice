package com.microservices.user.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Configuration
public class SecurityHeadersConfig {

    @Bean
    public SecurityHeadersFilter securityHeadersFilter() {
        return new SecurityHeadersFilter();
    }

    public static class SecurityHeadersFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                FilterChain filterChain) throws ServletException, IOException {
            
            // OWASP Security Headers
            
            // Prevent clickjacking
            response.setHeader("X-Frame-Options", "DENY");
            
            // Prevent MIME type sniffing
            response.setHeader("X-Content-Type-Options", "nosniff");
            
            // XSS Protection (for older browsers)
            response.setHeader("X-XSS-Protection", "1; mode=block");
            
            // Referrer Policy
            response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            
            // Content Security Policy
            response.setHeader("Content-Security-Policy", 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "connect-src 'self'; " +
                "font-src 'self'; " +
                "object-src 'none'; " +
                "media-src 'self'; " +
                "frame-src 'none';");
            
            // HTTP Strict Transport Security (HSTS)
            response.setHeader("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains; preload");
            
            // Permissions Policy (Feature Policy)
            response.setHeader("Permissions-Policy", 
                "camera=(), microphone=(), geolocation=(), interest-cohort=()");
            
            // Server header removal for security through obscurity
            response.setHeader("Server", "");
            
            // API Rate Limiting Info Headers
            if (request.getRequestURI().startsWith("/auth/")) {
                response.setHeader("X-RateLimit-Limit", "10");
                response.setHeader("X-RateLimit-Window", "60");
            } else {
                response.setHeader("X-RateLimit-Limit", "100");
                response.setHeader("X-RateLimit-Window", "60");
            }
            
            filterChain.doFilter(request, response);
        }
    }
}