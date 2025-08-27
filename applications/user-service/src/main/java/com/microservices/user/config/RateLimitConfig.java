package com.microservices.user.config;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Bean
    public RateLimiterRegistry rateLimiterRegistry() {
        return RateLimiterRegistry.ofDefaults();
    }

    @Bean
    public RateLimiter authRateLimiter() {
        RateLimiterConfig config = RateLimiterConfig.custom()
                .limitRefreshPeriod(Duration.ofMinutes(1))
                .limitForPeriod(10) // 10 login attempts per minute
                .timeoutDuration(Duration.ofSeconds(5))
                .build();
        return RateLimiter.of("authRateLimiter", config);
    }

    @Bean
    public RateLimiter userApiRateLimiter() {
        RateLimiterConfig config = RateLimiterConfig.custom()
                .limitRefreshPeriod(Duration.ofMinutes(1))
                .limitForPeriod(100) // 100 API calls per minute
                .timeoutDuration(Duration.ofSeconds(1))
                .build();
        return RateLimiter.of("userApiRateLimiter", config);
    }

    @Bean
    public RateLimiter adminApiRateLimiter() {
        RateLimiterConfig config = RateLimiterConfig.custom()
                .limitRefreshPeriod(Duration.ofMinutes(1))
                .limitForPeriod(200) // 200 admin API calls per minute
                .timeoutDuration(Duration.ofSeconds(1))
                .build();
        return RateLimiter.of("adminApiRateLimiter", config);
    }
}