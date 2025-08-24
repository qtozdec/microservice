package com.microservices.inventory.config;

import com.microservices.inventory.audit.AuditInterceptor;
import com.microservices.inventory.audit.AuditLogger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AuditConfig implements WebMvcConfigurer {

    private final AuditLogger auditLogger;

    public AuditConfig(AuditLogger auditLogger) {
        this.auditLogger = auditLogger;
    }

    @Bean
    public AuditInterceptor auditInterceptor() {
        System.out.println("DEBUG: Creating AuditInterceptor bean");
        AuditInterceptor interceptor = new AuditInterceptor();
        System.out.println("DEBUG: Setting AuditLogger: " + (auditLogger != null ? "available" : "null"));
        interceptor.setAuditLogger(auditLogger);
        System.out.println("DEBUG: AuditInterceptor bean created successfully");
        return interceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        System.out.println("DEBUG: Adding audit interceptor to registry");
        registry.addInterceptor(auditInterceptor())
                .addPathPatterns("/products/**", "/inventory/**", "/api/products/**", "/api/inventory/**")
                .excludePathPatterns("/health/**", "/actuator/**", "/swagger/**", "/v3/api-docs/**");
        System.out.println("DEBUG: Audit interceptor added to registry for paths: /products/**, /inventory/**, /api/products/**, /api/inventory/**");
    }
}