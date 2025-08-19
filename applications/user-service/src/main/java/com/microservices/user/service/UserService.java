package com.microservices.user.service;

import com.microservices.user.model.User;
import com.microservices.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    
    public User createUser(User user) {
        User savedUser = userRepository.save(user);
        kafkaTemplate.send("user-events", "User created: " + savedUser.getId());
        return savedUser;
    }
    
    @Cacheable("users")
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    @Cacheable("users")
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        
        User updatedUser = userRepository.save(user);
        kafkaTemplate.send("user-events", "User updated: " + updatedUser.getId());
        return updatedUser;
    }
    
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
        kafkaTemplate.send("user-events", "User deleted: " + id);
    }
}