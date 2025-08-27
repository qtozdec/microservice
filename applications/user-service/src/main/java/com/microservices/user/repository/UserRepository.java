package com.microservices.user.repository;

import com.microservices.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.lastLoginAt > :since")
    long countByLastLoginAfter(LocalDateTime since);
}