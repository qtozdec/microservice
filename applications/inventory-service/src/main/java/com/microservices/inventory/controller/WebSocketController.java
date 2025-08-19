package com.microservices.inventory.controller;

import com.microservices.inventory.model.Product;
import com.microservices.inventory.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private InventoryService inventoryService;

    @MessageMapping("/inventory/subscribe")
    @SendTo("/topic/inventory")
    public Map<String, Object> subscribeToInventory() {
        Map<String, Object> response = new HashMap<>();
        response.put("type", "SUBSCRIPTION_CONFIRMED");
        response.put("topic", "inventory");
        response.put("timestamp", LocalDateTime.now());
        response.put("message", "Successfully subscribed to inventory updates");
        return response;
    }

    @SubscribeMapping("/topic/inventory")
    public Map<String, Object> onSubscribe() {
        Map<String, Object> welcomeMessage = new HashMap<>();
        welcomeMessage.put("type", "WELCOME");
        welcomeMessage.put("message", "Connected to inventory updates");
        welcomeMessage.put("timestamp", LocalDateTime.now());
        return welcomeMessage;
    }

    @MessageMapping("/inventory/getLowStock")
    @SendTo("/topic/inventory/low-stock")
    public Map<String, Object> getLowStockProducts() {
        List<Product> lowStockProducts = inventoryService.getLowStockProducts(10);
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "LOW_STOCK_PRODUCTS");
        response.put("products", lowStockProducts);
        response.put("count", lowStockProducts.size());
        response.put("timestamp", LocalDateTime.now());
        
        return response;
    }

    @MessageMapping("/inventory/getAll")
    @SendTo("/topic/inventory/products")
    public Map<String, Object> getAllProducts() {
        List<Product> products = inventoryService.getAllProducts();
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", "ALL_PRODUCTS");
        response.put("products", products);
        response.put("count", products.size());
        response.put("timestamp", LocalDateTime.now());
        
        return response;
    }

    // Method to broadcast inventory updates (called from InventoryService)
    public void broadcastInventoryUpdate(String eventType, Product product) {
        Map<String, Object> update = new HashMap<>();
        update.put("type", eventType);
        update.put("product", product);
        update.put("timestamp", LocalDateTime.now());
        
        messagingTemplate.convertAndSend("/topic/inventory", update);
        
        // Also send to specific product topic
        messagingTemplate.convertAndSend("/topic/inventory/product/" + product.getId(), update);
    }

    // Method to broadcast stock alerts
    public void broadcastStockAlert(Product product, String alertType) {
        Map<String, Object> alert = new HashMap<>();
        alert.put("type", "STOCK_ALERT");
        alert.put("alertType", alertType);
        alert.put("product", product);
        alert.put("currentStock", product.getQuantity());
        alert.put("timestamp", LocalDateTime.now());
        
        if (alertType.equals("LOW_STOCK")) {
            alert.put("message", "Low stock alert for " + product.getName() + ". Current stock: " + product.getQuantity());
        } else if (alertType.equals("OUT_OF_STOCK")) {
            alert.put("message", "Out of stock alert for " + product.getName());
        }
        
        messagingTemplate.convertAndSend("/topic/inventory/alerts", alert);
    }
}