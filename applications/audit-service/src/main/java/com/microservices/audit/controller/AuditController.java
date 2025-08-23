package com.microservices.audit.controller;

import com.microservices.audit.model.AuditEvent;
import com.microservices.audit.service.AuditService;
import com.microservices.audit.dto.AuditEventRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/audit")
@CrossOrigin(origins = "*")
public class AuditController {

    @Autowired
    private AuditService auditService;

    @GetMapping
    public ResponseEntity<Page<AuditEvent>> getAuditEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? 
            Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        return ResponseEntity.ok(auditService.getAuditEvents(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditEvent> getAuditEventById(@PathVariable Long id) {
        Optional<AuditEvent> auditEvent = auditService.getAuditEventById(id);
        return auditEvent.map(ResponseEntity::ok)
                        .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/service/{service}")
    public ResponseEntity<List<AuditEvent>> getAuditEventsByService(@PathVariable String service) {
        return ResponseEntity.ok(auditService.getAuditEventsByService(service));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditEvent>> getAuditEventsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(auditService.getAuditEventsByUser(userId));
    }

    @GetMapping("/entity-type/{entityType}")
    public ResponseEntity<List<AuditEvent>> getAuditEventsByEntityType(@PathVariable String entityType) {
        return ResponseEntity.ok(auditService.getAuditEventsByEntityType(entityType));
    }

    @GetMapping("/action/{action}")
    public ResponseEntity<List<AuditEvent>> getAuditEventsByAction(@PathVariable String action) {
        return ResponseEntity.ok(auditService.getAuditEventsByAction(action));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<AuditEvent>> getAuditEventsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(auditService.getAuditEventsByDateRange(startDate, endDate));
    }

    @GetMapping("/failed-operations")
    public ResponseEntity<List<AuditEvent>> getFailedOperations() {
        return ResponseEntity.ok(auditService.getFailedOperations());
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getAuditEventCount() {
        return ResponseEntity.ok(auditService.getAuditEventCount());
    }

    @GetMapping("/count/service/{service}")
    public ResponseEntity<Long> getAuditEventCountByService(@PathVariable String service) {
        return ResponseEntity.ok(auditService.getAuditEventCountByService(service));
    }

    @PostMapping("/log/security")
    public ResponseEntity<String> logSecurityEvent(
            @RequestParam String action,
            @RequestParam String entityType,
            @RequestParam String entityId,
            @RequestParam String userId,
            @RequestParam String details) {
        auditService.logSecurityEvent(action, entityType, entityId, userId, details);
        return ResponseEntity.ok("Security event logged successfully");
    }

    @PostMapping("/log/data-access")
    public ResponseEntity<String> logDataAccess(
            @RequestParam String entityType,
            @RequestParam String entityId,
            @RequestParam String userId,
            @RequestParam String action) {
        auditService.logDataAccess(entityType, entityId, userId, action);
        return ResponseEntity.ok("Data access event logged successfully");
    }

    @PostMapping("/log/compliance")
    public ResponseEntity<String> logComplianceEvent(
            @RequestParam String regulation,
            @RequestParam String action,
            @RequestParam String entityType,
            @RequestParam String entityId,
            @RequestParam String userId,
            @RequestParam String details) {
        auditService.logComplianceEvent(regulation, action, entityType, entityId, userId, details);
        return ResponseEntity.ok("Compliance event logged successfully");
    }

    @PostMapping("/events")
    public ResponseEntity<AuditEvent> createAuditEvent(@RequestBody AuditEventRequest request) {
        try {
            AuditEvent auditEvent = new AuditEvent();
            auditEvent.setEventType(request.getEventType());
            auditEvent.setServiceName(request.getServiceName());
            auditEvent.setUserId(request.getUserId());
            auditEvent.setSessionId(request.getSessionId());
            auditEvent.setResourceType(request.getResourceType());
            auditEvent.setResourceId(request.getResourceId());
            auditEvent.setAction(request.getAction());
            auditEvent.setDescription(request.getDescription());
            auditEvent.setIpAddress(request.getIpAddress());
            auditEvent.setUserAgent(request.getUserAgent());
            
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
            
            if (request.getTimestamp() != null) {
                auditEvent.setTimestamp(request.getTimestamp());
            }
            
            AuditEvent savedEvent = auditService.createAuditEvent(
                request.getServiceName(),
                request.getAction(),
                request.getResourceType(),
                request.getResourceId(),
                request.getUserId(),
                request.getMetadata()
            );
            
            return ResponseEntity.ok(savedEvent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}