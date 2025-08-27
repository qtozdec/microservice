package com.microservices.user.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import com.microservices.user.component.RateLimitingComponent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class TestRateLimitController {
    
    private static final Logger logger = LoggerFactory.getLogger(TestRateLimitController.class);
    
    @Autowired(required = false)
    private RateLimitingComponent rateLimitingComponent;
    
    @GetMapping("/test-rate-limit")
    public ResponseEntity<String> testRateLimit() {
        logger.info("TestRateLimit: Component is {}", rateLimitingComponent != null ? "INJECTED" : "NULL");
        
        if (rateLimitingComponent == null) {
            return ResponseEntity.ok("Rate limiting component is NULL");
        }
        
        String testKey = "test-key";
        boolean allowed = rateLimitingComponent.isAllowed(testKey);
        
        if (!allowed) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("X-RateLimit-Limit", "5")
                .body("Rate limited!");
        }
        
        return ResponseEntity.ok("Request allowed. Remaining: " + rateLimitingComponent.getRemainingRequests(testKey));
    }
}