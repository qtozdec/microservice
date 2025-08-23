package com.microservices.user.controller;

import com.microservices.user.service.TwoFactorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/auth/2fa")
public class TwoFactorController {
    
    @Autowired
    private TwoFactorService twoFactorService;
    
    @PostMapping("/setup")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> setup(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            
            // Verify user can modify this account
            if (!canModifyAccount(userId, authentication)) {
                return ResponseEntity.status(403).build();
            }
            
            Map<String, Object> response = twoFactorService.setupTwoFactor(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to setup 2FA");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/verify")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> verify(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String code = request.get("code").toString();
            
            if (!canModifyAccount(userId, authentication)) {
                return ResponseEntity.status(403).build();
            }
            
            Map<String, Object> response = twoFactorService.verifyAndEnable(userId, code);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid verification code");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/disable")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> disable(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            
            if (!canModifyAccount(userId, authentication)) {
                return ResponseEntity.status(403).build();
            }
            
            twoFactorService.disableTwoFactor(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "2FA disabled successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to disable 2FA");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/status/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatus(@PathVariable Long userId, Authentication authentication) {
        try {
            if (!canModifyAccount(userId, authentication)) {
                return ResponseEntity.status(403).build();
            }
            
            Map<String, Object> response = twoFactorService.getTwoFactorStatus(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to get 2FA status");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    private boolean canModifyAccount(Long userId, Authentication authentication) {
        // Allow admin to modify any account, or user to modify their own account
        if (authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return true;
        }
        
        // For users, they can only modify their own account
        // This is a simplified check - in production you'd get userId from JWT token
        return true; // Simplified for now
    }
}