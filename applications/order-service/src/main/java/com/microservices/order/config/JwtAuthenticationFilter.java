package com.microservices.order.config;

import com.microservices.order.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Autowired
    private JwtService jwtService;
    
    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        // Skip JWT processing for actuator and health endpoints
        String requestPath = request.getRequestURI();
        if (requestPath.startsWith("/actuator") || requestPath.startsWith("/health")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;
        final String role;
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        jwt = authHeader.substring(7);
        
        try {
            userEmail = jwtService.extractEmail(jwt);
            
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                role = jwtService.extractRole(jwt);
                
                if (jwtService.isTokenValid(jwt, userEmail)) {
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userEmail,
                        null,
                        Collections.singletonList(authority)
                    );
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("JWT authentication successful for user: {} with role: {} (authority: {})", userEmail, role, authority.getAuthority());
                    logger.info("SecurityContext authentication set: {}, authorities: {}", 
                        SecurityContextHolder.getContext().getAuthentication().getName(),
                        SecurityContextHolder.getContext().getAuthentication().getAuthorities());
                } else {
                    logger.info("JWT token validation failed for user: {}", userEmail);
                }
            }
        } catch (Exception e) {
            logger.info("JWT processing failed for token: {} - Error: {}", jwt != null ? jwt.substring(0, Math.min(jwt.length(), 50)) + "..." : "null", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
}