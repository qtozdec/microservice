package com.microservices.user.dto;

import com.microservices.user.model.Role;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private String email;
    private String name;
    private Role role;
    private Long userId;
    
    public AuthResponse() {}
    
    public AuthResponse(String token, String refreshToken, String email, String name, Role role, Long userId) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.email = email;
        this.name = name;
        this.role = role;
        this.userId = userId;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getRefreshToken() {
        return refreshToken;
    }
    
    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Role getRole() {
        return role;
    }
    
    public void setRole(Role role) {
        this.role = role;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
}