package com.microservices.audit.service;

import com.microservices.audit.model.AuditEvent;
import com.microservices.audit.repository.AuditEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class AuditService {

    @Autowired
    private AuditEventRepository auditEventRepository;

    public AuditEvent createAuditEvent(String service, String action, String entityType, 
                                     String entityId, String userId, Object metadata) {
        AuditEvent auditEvent = new AuditEvent();
        auditEvent.setEventType("DATA_ACCESS"); // Default event type
        auditEvent.setServiceName(service);
        auditEvent.setAction(action);
        auditEvent.setResourceType(entityType);
        auditEvent.setResourceId(entityId);
        auditEvent.setUserId(userId);
        auditEvent.setResult(AuditEvent.AuditResult.SUCCESS); // Default result
        
        // Convert metadata to Map<String, String>
        if (metadata != null) {
            Map<String, String> metadataMap = new HashMap<>();
            metadataMap.put("data", metadata.toString());
            auditEvent.setMetadata(metadataMap);
        }
        
        auditEvent.setTimestamp(LocalDateTime.now());
        auditEvent.setIpAddress(getCurrentIpAddress());
        auditEvent.setUserAgent(getCurrentUserAgent());
        
        return auditEventRepository.save(auditEvent);
    }

    public Page<AuditEvent> getAuditEvents(Pageable pageable) {
        return auditEventRepository.findAll(pageable);
    }

    public Optional<AuditEvent> getAuditEventById(Long id) {
        return auditEventRepository.findById(id);
    }

    public List<AuditEvent> getAuditEventsByService(String service) {
        return auditEventRepository.findByServiceNameOrderByTimestampDesc(service);
    }

    public List<AuditEvent> getAuditEventsByUser(String userId) {
        return auditEventRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    public List<AuditEvent> getAuditEventsByEntityType(String entityType) {
        return auditEventRepository.findByResourceTypeOrderByTimestampDesc(entityType);
    }

    public List<AuditEvent> getAuditEventsByAction(String action) {
        return auditEventRepository.findByActionOrderByTimestampDesc(action);
    }

    public List<AuditEvent> getAuditEventsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return auditEventRepository.findByTimestampBetweenOrderByTimestampDesc(startDate, endDate);
    }

    public List<AuditEvent> getFailedOperations() {
        return auditEventRepository.findByActionContainingIgnoreCaseOrderByTimestampDesc("FAILED");
    }

    public Long getAuditEventCount() {
        return auditEventRepository.count();
    }

    public Long getAuditEventCountByService(String service) {
        return auditEventRepository.countByServiceName(service);
    }

    // Kafka event listeners
    @KafkaListener(topics = "user-events", groupId = "audit-service-group")
    public void handleUserEvent(Object event) {
        try {
            // Parse user event and create audit record
            createAuditEvent("user-service", "USER_EVENT", "User", 
                           extractEntityId(event), extractUserId(event), event);
        } catch (Exception e) {
            System.err.println("Error processing user event: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "order-events", groupId = "audit-service-group")
    public void handleOrderEvent(Object event) {
        try {
            // Parse order event and create audit record
            createAuditEvent("order-service", "ORDER_EVENT", "Order", 
                           extractEntityId(event), extractUserId(event), event);
        } catch (Exception e) {
            System.err.println("Error processing order event: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "inventory-events", groupId = "audit-service-group")
    public void handleInventoryEvent(Object event) {
        try {
            // Parse inventory event and create audit record
            createAuditEvent("inventory-service", "INVENTORY_EVENT", "Product", 
                           extractEntityId(event), "system", event);
        } catch (Exception e) {
            System.err.println("Error processing inventory event: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "notification-events", groupId = "audit-service-group")
    public void handleNotificationEvent(Object event) {
        try {
            // Parse notification event and create audit record
            createAuditEvent("notification-service", "NOTIFICATION_EVENT", "Notification", 
                           extractEntityId(event), extractUserId(event), event);
        } catch (Exception e) {
            System.err.println("Error processing notification event: " + e.getMessage());
        }
    }

    // Security and compliance methods
    public void logSecurityEvent(String action, String entityType, String entityId, 
                                String userId, String details) {
        AuditEvent auditEvent = createAuditEvent("security", action, entityType, entityId, userId, details);
        auditEvent.setEventType("SECURITY");
        auditEvent.setDescription(details);
        auditEventRepository.save(auditEvent);
    }

    public void logDataAccess(String entityType, String entityId, String userId, String action) {
        createAuditEvent("data-access", action, entityType, entityId, userId, 
                        "Data access event for compliance tracking");
    }

    public void logComplianceEvent(String regulation, String action, String entityType, 
                                  String entityId, String userId, String details) {
        AuditEvent auditEvent = createAuditEvent("compliance", action, entityType, entityId, userId, details);
        
        // Add regulation to metadata
        Map<String, String> metadata = auditEvent.getMetadata();
        if (metadata == null) {
            metadata = new HashMap<>();
        }
        metadata.put("regulation", regulation);
        auditEvent.setMetadata(metadata);
        
        auditEventRepository.save(auditEvent);
    }

    // Helper methods
    private String extractEntityId(Object event) {
        try {
            String eventStr = event.toString();
            
            // Parse ConsumerRecord value for order events
            if (eventStr.contains("Order status updated:") || eventStr.contains("Order")) {
                // Extract order ID from patterns like "Order status updated: 10 - CANCELLED"
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("Order.*?(\\d+)");
                java.util.regex.Matcher matcher = pattern.matcher(eventStr);
                if (matcher.find()) {
                    String orderId = matcher.group(1);
                    return orderId;
                }
            }
            
            // Parse other event types if needed
            return "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String extractUserId(Object event) {
        try {
            String eventStr = event.toString();
            
            // For now, use system as user since Kafka events don't contain user info
            // In a real system, events would include user context
            if (eventStr.contains("Order") || eventStr.contains("status updated")) {
                // These are system-generated events, so user is "system"
                return "system";
            }
            
            // Look for user ID patterns in the event if they exist
            java.util.regex.Pattern userPattern = java.util.regex.Pattern.compile("user[Ii]d[:\\s=]+(\\d+)");
            java.util.regex.Matcher userMatcher = userPattern.matcher(eventStr);
            if (userMatcher.find()) {
                String userId = userMatcher.group(1);
                return userId;
            }
            
            return "system";
        } catch (Exception e) {
            return "system";
        }
    }

    private String getCurrentIpAddress() {
        // In a real implementation, this would extract from the current request
        return "127.0.0.1";
    }

    private String getCurrentUserAgent() {
        // In a real implementation, this would extract from the current request
        return "Microservice";
    }

    public AuditEvent createAuditEventFromRequest(com.microservices.audit.dto.AuditEventRequest request) {
        AuditEvent auditEvent = new AuditEvent();
        
        // Set all fields from request
        auditEvent.setEventType(request.getEventType());
        auditEvent.setServiceName(request.getServiceName());
        auditEvent.setUserId(request.getUserId());
        auditEvent.setSessionId(request.getSessionId());
        auditEvent.setResourceType(request.getResourceType());
        auditEvent.setResourceId(request.getResourceId());
        auditEvent.setAction(request.getAction());
        auditEvent.setDescription(request.getDescription());
        auditEvent.setIpAddress(request.getIpAddress() != null ? request.getIpAddress() : getCurrentIpAddress());
        auditEvent.setUserAgent(request.getUserAgent() != null ? request.getUserAgent() : getCurrentUserAgent());
        
        // Parse result enum
        if (request.getResult() != null) {
            try {
                auditEvent.setResult(AuditEvent.AuditResult.valueOf(request.getResult()));
            } catch (IllegalArgumentException e) {
                auditEvent.setResult(AuditEvent.AuditResult.SUCCESS);
            }
        } else {
            auditEvent.setResult(AuditEvent.AuditResult.SUCCESS);
        }
        
        auditEvent.setErrorMessage(request.getErrorMessage());
        auditEvent.setMetadata(request.getMetadata());
        auditEvent.setDurationMs(request.getDurationMs());
        
        // Set timestamp - use from request or current time
        if (request.getTimestamp() != null) {
            auditEvent.setTimestamp(request.getTimestamp());
        } else {
            auditEvent.setTimestamp(LocalDateTime.now());
        }
        
        return auditEventRepository.save(auditEvent);
    }
}