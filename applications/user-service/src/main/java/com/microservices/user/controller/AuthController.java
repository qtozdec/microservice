package com.microservices.user.controller;

import com.microservices.user.dto.AuthResponse;
import com.microservices.user.dto.LoginRequest;
import com.microservices.user.dto.RegisterRequest;
import com.microservices.user.dto.RefreshTokenRequest;
import com.microservices.user.service.AuthService;
import com.microservices.user.audit.AuditLogger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private AuditLogger auditLogger;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        try {
            AuthResponse response = authService.register(request);
            auditLogger.logUserRegister(request.getEmail(), getSessionId(httpRequest), 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), 
                true, null);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            auditLogger.logUserRegister(request.getEmail(), getSessionId(httpRequest), 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), 
                false, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            AuthResponse response = authService.authenticate(request);
            auditLogger.logUserLogin(request.getEmail(), getSessionId(httpRequest), 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), true);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            auditLogger.logUserLogin(request.getEmail(), getSessionId(httpRequest), 
                httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"), false);
            return ResponseEntity.badRequest().build();
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
}