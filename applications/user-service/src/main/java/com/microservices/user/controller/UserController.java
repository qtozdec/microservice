package com.microservices.user.controller;

import com.microservices.user.model.User;
import com.microservices.user.service.UserService;
import com.microservices.user.audit.AuditLogger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private AuditLogger auditLogger;
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User createdUser = userService.createUser(user);
        return ResponseEntity.ok(createdUser);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('USER') and authentication.name == @userService.getUserById(#id).orElse(new com.microservices.user.model.User()).email)")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            User updatedUser = userService.updateUser(id, user);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @PathVariable Long id, 
            @RequestParam("file") MultipartFile file,
            Authentication authentication,
            HttpServletRequest request) {
        try {
            // Check if user can only modify their own avatar
            if (!authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                User currentUser = userService.getUserByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                if (!currentUser.getId().equals(id)) {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "You can only upload your own avatar");
                    auditLogger.logAvatarUpload(authentication.getName(), 
                        getSessionId(request), request.getRemoteAddr(), 
                        request.getHeader("User-Agent"), null, false, 
                        "Unauthorized avatar upload attempt for user " + id);
                    return ResponseEntity.status(403).body(error);
                }
            }
            
            if (file.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File is empty");
                auditLogger.logAvatarUpload(authentication.getName(), 
                    getSessionId(request), request.getRemoteAddr(), 
                    request.getHeader("User-Agent"), file.getOriginalFilename(), false, 
                    "Empty file upload attempt");
                return ResponseEntity.badRequest().body(error);
            }
            
            if (file.getSize() > 5 * 1024 * 1024) { // 5MB limit
                Map<String, String> error = new HashMap<>();
                error.put("error", "File size exceeds 5MB limit");
                auditLogger.logAvatarUpload(authentication.getName(), 
                    getSessionId(request), request.getRemoteAddr(), 
                    request.getHeader("User-Agent"), file.getOriginalFilename(), false, 
                    "File size exceeds 5MB limit: " + file.getSize() + " bytes");
                return ResponseEntity.badRequest().body(error);
            }
            
            String contentType = file.getContentType();
            if (!contentType.startsWith("image/")) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File must be an image");
                auditLogger.logAvatarUpload(authentication.getName(), 
                    getSessionId(request), request.getRemoteAddr(), 
                    request.getHeader("User-Agent"), file.getOriginalFilename(), false, 
                    "Invalid file type: " + contentType);
                return ResponseEntity.badRequest().body(error);
            }
            
            String avatarUrl = userService.uploadAvatar(id, file);
            
            // Log successful avatar upload
            auditLogger.logAvatarUpload(authentication.getName(), 
                getSessionId(request), request.getRemoteAddr(), 
                request.getHeader("User-Agent"), file.getOriginalFilename(), true, null);
            
            Map<String, String> response = new HashMap<>();
            response.put("avatarUrl", avatarUrl);
            response.put("message", "Avatar uploaded successfully");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            auditLogger.logAvatarUpload(authentication.getName(), 
                getSessionId(request), request.getRemoteAddr(), 
                request.getHeader("User-Agent"), file.getOriginalFilename(), false, 
                "Runtime error: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            auditLogger.logAvatarUpload(authentication.getName(), 
                getSessionId(request), request.getRemoteAddr(), 
                request.getHeader("User-Agent"), file.getOriginalFilename(), false, 
                "Unexpected error: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload avatar");
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    @GetMapping("/{id}/profile")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('USER') and authentication.name == @userService.getUserById(#id).orElse(new com.microservices.user.model.User()).email)")
    public ResponseEntity<User> getProfile(@PathVariable Long id) {
        return userService.getUserById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/profile")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('USER') and authentication.name == @userService.getUserById(#id).orElse(new com.microservices.user.model.User()).email)")
    public ResponseEntity<User> updateProfile(@PathVariable Long id, @RequestBody Map<String, Object> profileData, Authentication authentication, HttpServletRequest request) {
        try {
            User updatedUser = userService.updateProfile(id, profileData);
            
            // Convert profileData to Map<String, String> for audit logging
            Map<String, String> changes = new HashMap<>();
            profileData.forEach((key, value) -> {
                if (!"password".equals(key) && !"currentPassword".equals(key)) { // Don't log passwords
                    changes.put(key, value != null ? value.toString() : "null");
                }
            });
            
            auditLogger.logProfileUpdate(authentication.getName(), 
                getSessionId(request), request.getRemoteAddr(), 
                request.getHeader("User-Agent"), changes);
                
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            auditLogger.logEvent("USER_ACTION", "user-service", "UPDATE_PROFILE", 
                "PROFILE", id.toString(), authentication.getName(), 
                getSessionId(request), request.getRemoteAddr(), 
                request.getHeader("User-Agent"), "Profile update failed", 
                null, com.microservices.user.audit.AuditInterceptor.AuditResult.FAILURE, 
                e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            auditLogger.logEvent("USER_ACTION", "user-service", "UPDATE_PROFILE", 
                "PROFILE", id.toString(), authentication.getName(), 
                getSessionId(request), request.getRemoteAddr(), 
                request.getHeader("User-Agent"), "Profile update error", 
                null, com.microservices.user.audit.AuditInterceptor.AuditResult.ERROR, 
                e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}/avatar/{filename}")
    public ResponseEntity<Resource> getAvatar(@PathVariable Long id, @PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/avatars").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    private String getSessionId(HttpServletRequest request) {
        return request.getSession(false) != null ? request.getSession().getId() : "no-session";
    }
}