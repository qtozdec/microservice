package com.microservices.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableAspectJAutoProxy
@ComponentScan(basePackages = {
    "com.microservices.user.controller",
    "com.microservices.user.service", 
    "com.microservices.user.component",
    "com.microservices.user.config",
    "com.microservices.user.audit"
})
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}