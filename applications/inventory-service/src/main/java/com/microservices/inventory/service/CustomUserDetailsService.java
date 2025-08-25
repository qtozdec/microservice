package com.microservices.inventory.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    @Autowired
    private JwtService jwtService;
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // For microservices architecture, we don't store user data locally
        // We create a minimal UserDetails with the role from JWT
        // This is only used for JWT validation, not actual authentication
        
        return User.builder()
            .username(email)
            .password("") // Not used for JWT validation
            .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
            .build();
    }
    
    public UserDetails createUserDetailsWithRole(String email, String role) {
        return User.builder()
            .username(email)
            .password("") // Not used for JWT validation
            .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role)))
            .build();
    }
}