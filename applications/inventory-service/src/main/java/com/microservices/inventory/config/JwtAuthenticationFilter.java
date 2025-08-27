package com.microservices.inventory.config;

import com.microservices.inventory.service.JwtService;
import com.microservices.inventory.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        String requestPath = request.getServletPath();
        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        // Skip authentication for health and actuator endpoints
        if (requestPath.startsWith("/health") || 
            requestPath.startsWith("/actuator/")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.info("No Authorization header or not Bearer token for path: {}", requestPath);
            filterChain.doFilter(request, response);
            return;
        }
        
        logger.info("Processing JWT token for path: {}", requestPath);
        
        jwt = authHeader.substring(7);
        
        try {
            userEmail = jwtService.extractEmail(jwt);
            
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String userRole = jwtService.extractRole(jwt);
                UserDetails userDetails = userDetailsService.createUserDetailsWithRole(userEmail, userRole);
                
                if (jwtService.isTokenValid(jwt, userEmail)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("JWT authentication successful for user: {} with role: {}", userEmail, userRole);
                } else {
                    logger.info("JWT token validation failed for user: {}", userEmail);
                }
            }
        } catch (Exception e) {
            // Token is invalid, continue without authentication
            // The endpoint's security configuration will handle unauthorized access
            logger.info("JWT processing failed for token: {} - Error: {}", jwt != null ? jwt.substring(0, Math.min(jwt.length(), 50)) + "..." : "null", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
}