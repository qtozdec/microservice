package com.microservices.notification.config;

import com.microservices.notification.audit.AuditInterceptor;
import com.microservices.notification.audit.AuditLogger;
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
        AuditInterceptor interceptor = new AuditInterceptor();
        interceptor.setAuditLogger(auditLogger);
        return interceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(auditInterceptor())
                .addPathPatterns("/notifications/**", "/api/notifications/**")
                .excludePathPatterns("/health/**", "/actuator/**", "/swagger/**", "/v3/api-docs/**");
    }
}