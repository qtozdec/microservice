package com.microservices.order.util;

import org.slf4j.Logger;
import org.slf4j.MDC;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

public class StructuredLogger {
    
    private final Logger logger;
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    
    public StructuredLogger(Logger logger) {
        this.logger = logger;
    }
    
    public static StructuredLogger getLogger(Class<?> clazz) {
        return new StructuredLogger(org.slf4j.LoggerFactory.getLogger(clazz));
    }
    
    public void info(String message, KeyValue... keyValues) {
        logWithContext("INFO", message, null, keyValues);
    }
    
    public void warn(String message, KeyValue... keyValues) {
        logWithContext("WARN", message, null, keyValues);
    }
    
    public void error(String message, Throwable throwable, KeyValue... keyValues) {
        logWithContext("ERROR", message, throwable, keyValues);
    }
    
    public void debug(String message, KeyValue... keyValues) {
        logWithContext("DEBUG", message, null, keyValues);
    }
    
    private void logWithContext(String level, String message, Throwable throwable, KeyValue... keyValues) {
        Map<String, String> context = new HashMap<>();
        context.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMATTER));
        context.put("service", "order-service");
        
        for (KeyValue kv : keyValues) {
            context.put(kv.getKey(), String.valueOf(kv.getValue()));
        }
        
        // Set MDC for structured logging
        context.forEach(MDC::put);
        
        try {
            String structuredMessage = formatMessage(message, context);
            
            switch (level) {
                case "INFO":
                    logger.info(structuredMessage);
                    break;
                case "WARN":
                    logger.warn(structuredMessage);
                    break;
                case "ERROR":
                    if (throwable != null) {
                        logger.error(structuredMessage, throwable);
                    } else {
                        logger.error(structuredMessage);
                    }
                    break;
                case "DEBUG":
                    logger.debug(structuredMessage);
                    break;
            }
        } finally {
            MDC.clear();
        }
    }
    
    private String formatMessage(String message, Map<String, String> context) {
        StringBuilder sb = new StringBuilder(message);
        
        if (!context.isEmpty()) {
            sb.append(" | ");
            context.entrySet().forEach(entry -> 
                sb.append(entry.getKey()).append("=").append(entry.getValue()).append(" ")
            );
        }
        
        return sb.toString().trim();
    }
    
    public static KeyValue kv(String key, Object value) {
        return new KeyValue(key, value);
    }
    
    public static class KeyValue {
        private final String key;
        private final Object value;
        
        public KeyValue(String key, Object value) {
            this.key = key;
            this.value = value;
        }
        
        public String getKey() {
            return key;
        }
        
        public Object getValue() {
            return value;
        }
    }
}