package com.microservices.order.audit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.method.HandlerMethod;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class AuditInterceptor implements HandlerInterceptor, ApplicationContextAware {

    private AuditLogger auditLogger;
    private ApplicationContext applicationContext;
    
    public AuditInterceptor() {
        // Default constructor for manual instantiation
    }
    
    public void setAuditLogger(AuditLogger auditLogger) {
        this.auditLogger = auditLogger;
    }
    
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }
    
    private AuditLogger getAuditLogger() {
        if (auditLogger == null && applicationContext != null) {
            try {
                auditLogger = applicationContext.getBean(AuditLogger.class);
            } catch (Exception e) {
                // AuditLogger bean not available
            }
        }
        return auditLogger;
    }

    private final ThreadLocal<Long> startTime = new ThreadLocal<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        startTime.set(System.currentTimeMillis());
        
        // Skip audit for health checks and actuator endpoints
        if (shouldSkipAudit(request.getRequestURI())) {
            return true;
        }

        // Log the start of the request
        logRequestStart(request, handler);
        
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // Skip audit for health checks and actuator endpoints
        if (shouldSkipAudit(request.getRequestURI())) {
            return;
        }

        Long duration = System.currentTimeMillis() - startTime.get();
        startTime.remove();

        // Log the completion of the request
        logRequestCompletion(request, response, handler, ex, duration);
    }

    private void logRequestStart(HttpServletRequest request, Object handler) {
        String userId = getCurrentUserId();
        String sessionId = getSessionId(request);
        String action = getActionFromRequest(request, handler);
        String resourceType = getResourceTypeFromRequest(request);
        String resourceId = getResourceIdFromRequest(request);
        String jwtToken = extractJwtToken(request);
        
        Map<String, String> metadata = new HashMap<>();
        metadata.put("method", request.getMethod());
        metadata.put("uri", request.getRequestURI());
        metadata.put("query", request.getQueryString() != null ? request.getQueryString() : "");
        metadata.put("userAgent", request.getHeader("User-Agent"));
        metadata.put("referer", request.getHeader("Referer"));
        
        AuditLogger auditLogger = getAuditLogger();
        
        if (auditLogger != null) {
            auditLogger.logEvent(
                "REQUEST_START",
                "order-service",
                action,
                resourceType,
                resourceId,
                userId,
                sessionId,
                request.getRemoteAddr(),
                request.getHeader("User-Agent"),
                "Request initiated",
                metadata,
                AuditResult.SUCCESS,
                null,
                jwtToken
            );
        }
    }

    private void logRequestCompletion(HttpServletRequest request, HttpServletResponse response, 
                                    Object handler, Exception ex, Long duration) {
        String userId = getCurrentUserId();
        String sessionId = getSessionId(request);
        String action = getActionFromRequest(request, handler);
        String resourceType = getResourceTypeFromRequest(request);
        String resourceId = getResourceIdFromRequest(request);
        String jwtToken = extractJwtToken(request);
        
        Map<String, String> metadata = new HashMap<>();
        metadata.put("method", request.getMethod());
        metadata.put("uri", request.getRequestURI());
        metadata.put("responseStatus", String.valueOf(response.getStatus()));
        metadata.put("durationMs", String.valueOf(duration));
        
        AuditResult result;
        String errorMessage = null;
        
        if (ex != null) {
            result = AuditResult.ERROR;
            errorMessage = ex.getMessage();
            metadata.put("exception", ex.getClass().getSimpleName());
        } else if (response.getStatus() >= 400) {
            result = AuditResult.FAILURE;
            errorMessage = "HTTP Error: " + response.getStatus();
        } else {
            result = AuditResult.SUCCESS;
        }
        
        if (getAuditLogger() != null) {
            getAuditLogger().logEvent(
                "REQUEST_COMPLETE",
                "order-service",
                action,
                resourceType,
                resourceId,
                userId,
                sessionId,
                request.getRemoteAddr(),
                request.getHeader("User-Agent"),
                "Request completed",
                metadata,
                result,
                errorMessage,
                jwtToken
            );
        }
    }

    private boolean shouldSkipAudit(String uri) {
        return uri.startsWith("/health") || 
               uri.startsWith("/actuator") ||
               uri.startsWith("/swagger") ||
               uri.startsWith("/v3/api-docs");
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && 
            !"anonymousUser".equals(authentication.getPrincipal())) {
            return authentication.getName();
        }
        return "anonymous";
    }

    private String getSessionId(HttpServletRequest request) {
        return request.getSession(false) != null ? request.getSession().getId() : "no-session";
    }

    private String getActionFromRequest(HttpServletRequest request, Object handler) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        
        // Extract action based on HTTP method and URI pattern
        if (handler instanceof HandlerMethod) {
            HandlerMethod handlerMethod = (HandlerMethod) handler;
            String methodName = handlerMethod.getMethod().getName();
            
            // Map method names to user-friendly actions
            switch (methodName) {
                case "login": return "LOGIN";
                case "register": return "REGISTER";
                case "uploadAvatar": return "UPLOAD_AVATAR";
                case "updateProfile": return "UPDATE_PROFILE";
                case "getProfile": return "VIEW_PROFILE";
                case "changePassword": return "CHANGE_PASSWORD";
                case "enable2FA": return "ENABLE_2FA";
                case "disable2FA": return "DISABLE_2FA";
                case "verify2FA": return "VERIFY_2FA";
                default:
                    return method + "_" + methodName.toUpperCase();
            }
        }
        
        // Fallback to HTTP method + URI pattern
        if (uri.contains("/avatar")) return method + "_AVATAR";
        if (uri.contains("/profile")) return method + "_PROFILE";
        if (uri.contains("/login")) return "LOGIN";
        if (uri.contains("/register")) return "REGISTER";
        
        return method + "_" + uri.replaceAll("[^a-zA-Z0-9]", "_").toUpperCase();
    }

    private String getResourceTypeFromRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        
        if (uri.contains("/orders")) return "ORDER";
        if (uri.contains("/items")) return "ORDER_ITEM";
        if (uri.contains("/customers")) return "CUSTOMER";
        
        return "UNKNOWN";
    }

    private String getResourceIdFromRequest(HttpServletRequest request) {
        String uri = request.getRequestURI();
        
        // Extract ID from URI patterns like /orders/123 or /orders/123/items
        String[] parts = uri.split("/");
        for (int i = 0; i < parts.length - 1; i++) {
            if ("orders".equals(parts[i]) && i + 1 < parts.length) {
                String potentialId = parts[i + 1];
                // Check if it's a numeric ID
                if (potentialId.matches("\\d+")) {
                    return potentialId;
                }
            }
        }
        
        return "unknown";
    }

    private String extractJwtToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    public enum AuditResult {
        SUCCESS, FAILURE, ERROR
    }
}