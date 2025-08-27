package com.microservices.user.component;

import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingComponent {
    
    private static final Logger logger = LoggerFactory.getLogger(RateLimitingComponent.class);
    private final ConcurrentHashMap<String, RateLimitEntry> rateLimitMap = new ConcurrentHashMap<>();
    private final int maxRequestsPerMinute = 5; // Понизил лимит для легкого тестирования
    
    public boolean isAllowed(String identifier) {
        long currentTime = System.currentTimeMillis();
        String key = identifier;
        
        logger.info("Checking rate limit for key: {}", key);
        
        RateLimitEntry entry = rateLimitMap.computeIfAbsent(key, k -> {
            logger.info("Creating new rate limit entry for key: {}", k);
            return new RateLimitEntry(currentTime, new AtomicInteger(0));
        });
        
        // Reset window if more than 1 minute has passed
        if (currentTime - entry.getResetTime() > 60000) { // 60 seconds
            entry.setResetTime(currentTime);
            entry.getCount().set(0);
            logger.info("Reset rate limit window for key: {}", key);
        }
        
        int currentCount = entry.getCount().incrementAndGet();
        boolean allowed = currentCount <= maxRequestsPerMinute;
        
        logger.warn("Rate limit check: key={}, count={}/{}, allowed={}", 
                   key, currentCount, maxRequestsPerMinute, allowed);
        
        return allowed;
    }
    
    public int getRemainingRequests(String identifier) {
        RateLimitEntry entry = rateLimitMap.get(identifier);
        if (entry == null) {
            return maxRequestsPerMinute;
        }
        
        long currentTime = System.currentTimeMillis();
        if (currentTime - entry.getResetTime() > 60000) {
            return maxRequestsPerMinute;
        }
        
        return Math.max(0, maxRequestsPerMinute - entry.getCount().get());
    }
    
    public long getResetTimeInSeconds(String identifier) {
        RateLimitEntry entry = rateLimitMap.get(identifier);
        if (entry == null) {
            return 60;
        }
        
        long currentTime = System.currentTimeMillis();
        long resetTime = entry.getResetTime() + 60000; // + 1 minute
        return Math.max(0, (resetTime - currentTime) / 1000);
    }
    
    private static class RateLimitEntry {
        private long resetTime;
        private final AtomicInteger count;
        
        public RateLimitEntry(long resetTime, AtomicInteger count) {
            this.resetTime = resetTime;
            this.count = count;
        }
        
        public long getResetTime() {
            return resetTime;
        }
        
        public void setResetTime(long resetTime) {
            this.resetTime = resetTime;
        }
        
        public AtomicInteger getCount() {
            return count;
        }
    }
}