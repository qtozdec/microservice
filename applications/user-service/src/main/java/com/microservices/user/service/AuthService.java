package com.microservices.user.service;

import com.microservices.user.dto.AuthResponse;
import com.microservices.user.dto.LoginRequest;
import com.microservices.user.dto.RegisterRequest;
import com.microservices.user.model.User;
import com.microservices.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User with this email already exists");
        }
        
        var user = new User(
            request.getEmail(),
            request.getName(),
            passwordEncoder.encode(request.getPassword()),
            request.getRole()
        );
        
        userRepository.save(user);
        
        var jwtToken = jwtService.generateToken(
            user.getEmail(), 
            user.getRole().getAuthority(),
            user.getId()
        );
        
        return new AuthResponse(
            jwtToken, 
            user.getEmail(), 
            user.getName(), 
            user.getRole(),
            user.getId()
        );
    }
    
    public AuthResponse authenticate(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );
        
        var user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        var jwtToken = jwtService.generateToken(
            user.getEmail(),
            user.getRole().getAuthority(),
            user.getId()
        );
        
        return new AuthResponse(
            jwtToken,
            user.getEmail(),
            user.getName(),
            user.getRole(),
            user.getId()
        );
    }
}