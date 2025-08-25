package com.microservices.notification.service;

import com.microservices.notification.model.Notification;
import com.microservices.notification.model.NotificationType;
import com.microservices.notification.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    public Notification createNotification(Notification notification) {
        return notificationRepository.save(notification);
    }
    
    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public List<Notification> getUnreadNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false);
    }
    
    public Notification markAsRead(Long id) {
        Optional<Notification> notification = notificationRepository.findById(id);
        if (notification.isPresent()) {
            Notification n = notification.get();
            n.setIsRead(true);
            return notificationRepository.save(n);
        }
        throw new RuntimeException("Notification not found");
    }
    
    @KafkaListener(topics = "user-events", groupId = "notification-service-group")
    public void handleUserEvents(String message) {
        if (message.contains("User created:")) {
            String userId = message.split(":")[1].trim();
            Notification notification = new Notification(
                Long.parseLong(userId),
                "Welcome! Your account has been created successfully.",
                NotificationType.USER_EVENT
            );
            createNotification(notification);
        }
    }
    
    @KafkaListener(topics = "order-events", groupId = "notification-service-group")
    public void handleOrderEvents(String message) {
        if (message.contains("Order created:")) {
            String orderId = message.split(":")[1].trim();
            Notification notification = new Notification(
                1L,
                "Order " + orderId + " has been created successfully.",
                NotificationType.ORDER_EVENT
            );
            createNotification(notification);
        }
    }
}