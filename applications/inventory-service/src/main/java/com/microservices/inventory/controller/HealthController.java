package com.microservices.inventory.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    @Autowired
    private DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "inventory-service");
        health.put("timestamp", System.currentTimeMillis());
        health.put("checks", performHealthChecks());
        
        boolean allHealthy = health.get("checks") instanceof Map && 
            ((Map<?, ?>) health.get("checks")).values().stream()
                .allMatch(check -> check instanceof Map && "UP".equals(((Map<?, ?>) check).get("status")));
        
        if (!allHealthy) {
            health.put("status", "DOWN");
            return ResponseEntity.status(503).body(health);
        }
        
        return ResponseEntity.ok(health);
    }

    @GetMapping("/liveness")
    public ResponseEntity<Map<String, String>> liveness() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "inventory-service");
        return ResponseEntity.ok(status);
    }

    @GetMapping("/readiness")
    public ResponseEntity<Map<String, Object>> readiness() {
        Map<String, Object> readiness = new HashMap<>();
        readiness.put("service", "inventory-service");
        
        Map<String, Object> checks = performHealthChecks();
        boolean ready = checks.values().stream()
            .allMatch(check -> check instanceof Map && "UP".equals(((Map<?, ?>) check).get("status")));
        
        readiness.put("status", ready ? "UP" : "DOWN");
        readiness.put("checks", checks);
        
        if (ready) {
            return ResponseEntity.ok(readiness);
        } else {
            return ResponseEntity.status(503).body(readiness);
        }
    }

    private Map<String, Object> performHealthChecks() {
        Map<String, Object> checks = new HashMap<>();
        checks.put("database", checkDatabase());
        return checks;
    }

    private Map<String, Object> checkDatabase() {
        Map<String, Object> dbHealth = new HashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            boolean isValid = connection.isValid(3);
            dbHealth.put("status", isValid ? "UP" : "DOWN");
            dbHealth.put("database", "PostgreSQL");
            if (isValid) {
                dbHealth.put("validationQuery", "SELECT 1");
            }
        } catch (SQLException e) {
            dbHealth.put("status", "DOWN");
            dbHealth.put("error", e.getMessage());
        }
        return dbHealth;
    }
}