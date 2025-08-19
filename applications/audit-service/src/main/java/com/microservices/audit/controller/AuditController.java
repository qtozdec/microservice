package com.microservices.audit.controller;

import com.microservices.audit.model.AuditEvent;
import com.microservices.audit.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
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
    public ResponseEntity<AuditEvent> getAuditEventById(@PathVariable UUID id) {
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
}