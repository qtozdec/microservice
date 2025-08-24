package com.microservices.notification.audit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
public class AuditLogger {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${audit.service.url:http://audit-service:8085}")
    private String auditServiceUrl;

    @Value("${audit.service.enabled:true}")
    private boolean auditEnabled;

    public void logEvent(String eventType, String serviceName, String action, 
                        String resourceType, String resourceId, String userId, 
                        String sessionId, String ipAddress, String userAgent, 
                        String description, Map<String, String> metadata, 
                        AuditInterceptor.AuditResult result, String errorMessage) {
        
        if (!auditEnabled) {
            return;
        }

        // Log asynchronously to avoid blocking the main request
        CompletableFuture.runAsync(() -> {
            try {
                sendAuditEvent(eventType, serviceName, action, resourceType, resourceId, 
                              userId, sessionId, ipAddress, userAgent, description, 
                              metadata, result, errorMessage);
            } catch (Exception e) {
                System.err.println("Failed to send audit event: " + e.getMessage());
                // Could implement fallback logging to local file system here
            }
        });
    }

    private void sendAuditEvent(String eventType, String serviceName, String action, 
                               String resourceType, String resourceId, String userId, 
                               String sessionId, String ipAddress, String userAgent, 
                               String description, Map<String, String> metadata, 
                               AuditInterceptor.AuditResult result, String errorMessage) {
        
        AuditEventDto auditEvent = new AuditEventDto();
        auditEvent.setEventType(eventType);
        auditEvent.setServiceName(serviceName);
        auditEvent.setAction(action);
        auditEvent.setResourceType(resourceType);
        auditEvent.setResourceId(resourceId);
        auditEvent.setUserId(userId);
        auditEvent.setSessionId(sessionId);
        auditEvent.setIpAddress(ipAddress);
        auditEvent.setUserAgent(userAgent);
        auditEvent.setDescription(description);
        auditEvent.setMetadata(metadata);
        auditEvent.setResult(result.name());
        auditEvent.setErrorMessage(errorMessage);
        auditEvent.setTimestamp(LocalDateTime.now());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<AuditEventDto> request = new HttpEntity<>(auditEvent, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                auditServiceUrl + "/audit/events", request, String.class);
            
            if (response.getStatusCode() != HttpStatus.OK && 
                response.getStatusCode() != HttpStatus.CREATED) {
                System.err.println("Audit service returned non-success status: " + 
                                 response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("Failed to send audit event to service: " + e.getMessage());
            // Fallback to local logging
            logToConsole(auditEvent);
        }
    }

    private void logToConsole(AuditEventDto event) {
        System.out.println("[AUDIT] " + event.getTimestamp() + " | " +
                          event.getUserId() + " | " + 
                          event.getAction() + " | " + 
                          event.getResourceType() + " | " +
                          event.getResult() + " | " +
                          (event.getErrorMessage() != null ? event.getErrorMessage() : "SUCCESS"));
    }

    // Convenience methods for specific audit events
    public void logUserLogin(String userId, String sessionId, String ipAddress, String userAgent, boolean success) {
        logEvent("USER_ACTION", "user-service", "LOGIN", "AUTHENTICATION", userId, 
                userId, sessionId, ipAddress, userAgent, 
                success ? "User logged in successfully" : "User login failed", 
                null, success ? AuditInterceptor.AuditResult.SUCCESS : AuditInterceptor.AuditResult.FAILURE, 
                success ? null : "Invalid credentials");
    }

    public void logUserRegister(String userId, String sessionId, String ipAddress, String userAgent, boolean success, String errorMessage) {
        logEvent("USER_ACTION", "user-service", "REGISTER", "USER", userId, 
                userId, sessionId, ipAddress, userAgent, 
                success ? "User registered successfully" : "User registration failed", 
                null, success ? AuditInterceptor.AuditResult.SUCCESS : AuditInterceptor.AuditResult.FAILURE, 
                errorMessage);
    }

    public void logProfileUpdate(String userId, String sessionId, String ipAddress, String userAgent, Map<String, String> changes) {
        logEvent("USER_ACTION", "user-service", "UPDATE_PROFILE", "PROFILE", userId, 
                userId, sessionId, ipAddress, userAgent, 
                "User profile updated", changes, AuditInterceptor.AuditResult.SUCCESS, null);
    }

    public void logAvatarUpload(String userId, String sessionId, String ipAddress, String userAgent, String filename, boolean success, String errorMessage) {
        Map<String, String> metadata = Map.of("filename", filename != null ? filename : "unknown");
        logEvent("USER_ACTION", "user-service", "UPLOAD_AVATAR", "AVATAR", userId, 
                userId, sessionId, ipAddress, userAgent, 
                success ? "Avatar uploaded successfully" : "Avatar upload failed", 
                metadata, success ? AuditInterceptor.AuditResult.SUCCESS : AuditInterceptor.AuditResult.FAILURE, 
                errorMessage);
    }

    public void logPasswordChange(String userId, String sessionId, String ipAddress, String userAgent, boolean success, String errorMessage) {
        logEvent("SECURITY_ACTION", "user-service", "CHANGE_PASSWORD", "USER", userId, 
                userId, sessionId, ipAddress, userAgent, 
                success ? "Password changed successfully" : "Password change failed", 
                null, success ? AuditInterceptor.AuditResult.SUCCESS : AuditInterceptor.AuditResult.FAILURE, 
                errorMessage);
    }

    public void log2FAEvent(String userId, String sessionId, String ipAddress, String userAgent, String action, boolean success, String errorMessage) {
        logEvent("SECURITY_ACTION", "user-service", action, "TWO_FACTOR_AUTH", userId, 
                userId, sessionId, ipAddress, userAgent, 
                "Two-factor authentication " + action.toLowerCase().replace("_", " "), 
                null, success ? AuditInterceptor.AuditResult.SUCCESS : AuditInterceptor.AuditResult.FAILURE, 
                errorMessage);
    }

    public void logDataAccess(String userId, String resourceType, String resourceId, String action, String ipAddress) {
        logEvent("DATA_ACCESS", "user-service", action, resourceType, resourceId, 
                userId, "no-session", ipAddress, "API", 
                "Data access event", null, AuditInterceptor.AuditResult.SUCCESS, null);
    }

    public void logSecurityViolation(String userId, String sessionId, String ipAddress, String userAgent, String violation, String details) {
        Map<String, String> metadata = Map.of("violation", violation, "details", details);
        logEvent("SECURITY_VIOLATION", "user-service", "SECURITY_VIOLATION", "SECURITY", "system", 
                userId, sessionId, ipAddress, userAgent, 
                "Security violation detected: " + violation, 
                metadata, AuditInterceptor.AuditResult.ERROR, details);
    }
}