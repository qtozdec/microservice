package com.microservices.user.controller;

import com.microservices.user.dto.AuthResponse;
import com.microservices.user.dto.LoginRequest;
import com.microservices.user.dto.RegisterRequest;
import com.microservices.user.dto.RefreshTokenRequest;
import com.microservices.user.service.AuthService;
import com.microservices.user.audit.AuditLogger;
import com.microservices.user.component.RateLimitingComponent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private AuditLogger auditLogger;
    
    @Autowired
    private RateLimitingComponent rateLimitingComponent;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        // Check rate limiting
        String clientKey = getClientKey(httpRequest, request.getEmail());
        if (!rateLimitingComponent.isAllowed(clientKey)) {
            addRateLimitHeaders(httpRequest, clientKey);
            auditLogger.logUserRegister(request.getEmail(), getSessionId(httpRequest), 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), 
                false, "Rate limited");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("X-RateLimit-Limit", "5")
                .header("X-RateLimit-Window", "60")
                .header("X-RateLimit-Remaining", String.valueOf(rateLimitingComponent.getRemainingRequests(clientKey)))
                .header("X-RateLimit-Reset", String.valueOf(rateLimitingComponent.getResetTimeInSeconds(clientKey)))
                .body(new AuthResponse("Too many requests. Please try again later."));
        }
        
        try {
            AuthResponse response = authService.register(request);
            auditLogger.logUserRegister(request.getEmail(), getSessionId(httpRequest), 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), 
                true, null);
            
            // Add rate limit headers to successful responses
            return ResponseEntity.ok()
                .header("X-RateLimit-Limit", "5")
                .header("X-RateLimit-Window", "60")
                .header("X-RateLimit-Remaining", String.valueOf(rateLimitingComponent.getRemainingRequests(clientKey)))
                .header("X-RateLimit-Reset", String.valueOf(rateLimitingComponent.getResetTimeInSeconds(clientKey)))
                .body(response);
        } catch (RuntimeException e) {
            auditLogger.logUserRegister(request.getEmail(), getSessionId(httpRequest), 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), 
                false, e.getMessage());
            return ResponseEntity.badRequest()
                .header("X-RateLimit-Limit", "5")
                .header("X-RateLimit-Window", "60")
                .header("X-RateLimit-Remaining", String.valueOf(rateLimitingComponent.getRemainingRequests(clientKey)))
                .header("X-RateLimit-Reset", String.valueOf(rateLimitingComponent.getResetTimeInSeconds(clientKey)))
                .build();
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        // Check rate limiting
        String clientKey = getClientKey(httpRequest, request.getEmail());
        logger.info("Login attempt from: {} with key: {}", request.getEmail(), clientKey);
        logger.info("Rate limiting component: {}", rateLimitingComponent != null ? "INJECTED" : "NULL");
        
        if (rateLimitingComponent != null && !rateLimitingComponent.isAllowed(clientKey)) {
            logger.warn("Rate limit exceeded for key: {}", clientKey);
            addRateLimitHeaders(httpRequest, clientKey);
            auditLogger.logUserLogin(request.getEmail(), getSessionId(httpRequest), 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), false);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("X-RateLimit-Limit", "5")
                .header("X-RateLimit-Window", "60")
                .header("X-RateLimit-Remaining", String.valueOf(rateLimitingComponent.getRemainingRequests(clientKey)))
                .header("X-RateLimit-Reset", String.valueOf(rateLimitingComponent.getResetTimeInSeconds(clientKey)))
                .body(new AuthResponse("Too many login attempts. Please try again later."));
        }
        
        try {
            AuthResponse response = authService.authenticate(request);
            auditLogger.logUserLogin(request.getEmail(), getSessionId(httpRequest), 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), true);
            
            return ResponseEntity.ok()
                .header("X-RateLimit-Limit", "5")
                .header("X-RateLimit-Window", "60")
                .header("X-RateLimit-Remaining", String.valueOf(rateLimitingComponent.getRemainingRequests(clientKey)))
                .header("X-RateLimit-Reset", String.valueOf(rateLimitingComponent.getResetTimeInSeconds(clientKey)))
                .body(response);
        } catch (RuntimeException e) {
            auditLogger.logUserLogin(request.getEmail(), getSessionId(httpRequest), 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), false);
            return ResponseEntity.badRequest()
                .header("X-RateLimit-Limit", "5")
                .header("X-RateLimit-Window", "60")
                .header("X-RateLimit-Remaining", String.valueOf(rateLimitingComponent.getRemainingRequests(clientKey)))
                .header("X-RateLimit-Reset", String.valueOf(rateLimitingComponent.getResetTimeInSeconds(clientKey)))
                .build();
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            AuthResponse response = authService.refreshToken(request.getRefreshToken());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    private String getSessionId(HttpServletRequest request) {
        return request.getSession(false) != null ? request.getSession().getId() : "no-session";
    }
    
    private String getClientKey(HttpServletRequest request, String email) {
        // Use IP address for rate limiting key (easier for testing)
        return request.getRemoteAddr();
    }
    
    private void addRateLimitHeaders(HttpServletRequest httpRequest, String clientKey) {
        // This method exists for consistency but headers are added inline
    }
}