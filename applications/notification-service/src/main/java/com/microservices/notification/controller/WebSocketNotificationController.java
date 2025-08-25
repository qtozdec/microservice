package com.microservices.notification.controller;

import com.microservices.notification.dto.NotificationDTO;
import com.microservices.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

@Controller
public class WebSocketNotificationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private NotificationService notificationService;

    @MessageMapping("/subscribe")
    @SendTo("/topic/notifications")
    public NotificationDTO subscribe(@Payload Map<String, String> payload, Principal principal) {
        // User subscribed to notifications
        
        NotificationDTO welcomeNotification = new NotificationDTO();
        welcomeNotification.setTitle("Connected");
        welcomeNotification.setMessage("Real-time notifications enabled");
        welcomeNotification.setType("success");
        welcomeNotification.setTimestamp(LocalDateTime.now());
        
        return welcomeNotification;
    }

    public void sendNotificationToUser(Long userId, NotificationDTO notification) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(), 
            "/queue/notifications", 
            notification
        );
    }

    public void sendNotificationToAll(NotificationDTO notification) {
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    public void sendOrderUpdate(Long userId, String orderId, String status) {
        NotificationDTO notification = new NotificationDTO();
        notification.setTitle("Order Update");
        notification.setMessage("Order #" + orderId + " status changed to: " + status);
        notification.setType("info");
        notification.setTimestamp(LocalDateTime.now());
        
        sendNotificationToUser(userId, notification);
    }

    public void sendSystemAlert(String message, String type) {
        NotificationDTO notification = new NotificationDTO();
        notification.setTitle("System Alert");
        notification.setMessage(message);
        notification.setType(type);
        notification.setTimestamp(LocalDateTime.now());
        
        sendNotificationToAll(notification);
    }
}