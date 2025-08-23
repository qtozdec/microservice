package com.microservices.user.service;

import com.microservices.user.model.User;
import com.microservices.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

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
    
    public String uploadAvatar(Long userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Create upload directory if it doesn't exist
        Path uploadDir = Paths.get("uploads/avatars");
        Files.createDirectories(uploadDir);
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = UUID.randomUUID().toString() + extension;
        
        // Save file
        Path filePath = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Update user avatar URL
        String avatarUrl = "/users/" + userId + "/avatar/" + filename;
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        
        kafkaTemplate.send("user-events", "User avatar updated: " + userId);
        
        return avatarUrl;
    }
    
    public User updateProfile(Long userId, Map<String, Object> profileData) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (profileData.containsKey("name")) {
            user.setName((String) profileData.get("name"));
        }
        if (profileData.containsKey("phone")) {
            user.setPhone((String) profileData.get("phone"));
        }
        if (profileData.containsKey("address")) {
            user.setAddress((String) profileData.get("address"));
        }
        if (profileData.containsKey("bio")) {
            user.setBio((String) profileData.get("bio"));
        }
        
        User updatedUser = userRepository.save(user);
        kafkaTemplate.send("user-events", "User profile updated: " + userId);
        
        return updatedUser;
    }
}