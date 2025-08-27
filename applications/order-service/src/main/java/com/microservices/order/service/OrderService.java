package com.microservices.order.service;

import com.microservices.order.model.Order;
import com.microservices.order.model.OrderStatus;
import com.microservices.order.repository.OrderRepository;
import com.microservices.order.util.StructuredLogger;
import static com.microservices.order.util.StructuredLogger.kv;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderService {
    
    private static final StructuredLogger logger = StructuredLogger.getLogger(OrderService.class);
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    
    public Order createOrder(Order order) {
        logger.info("Creating new order", 
            kv("userId", order.getUserId()),
            kv("product", order.getProduct()),
            kv("quantity", order.getQuantity()),
            kv("price", order.getPrice())
        );
        
        try {
            Order savedOrder = orderRepository.save(order);
            kafkaTemplate.send("order-events", "Order created: " + savedOrder.getId());
            
            logger.info("Order created successfully", 
                kv("orderId", savedOrder.getId()),
                kv("userId", savedOrder.getUserId()),
                kv("status", savedOrder.getStatus())
            );
            
            return savedOrder;
        } catch (Exception e) {
            logger.error("Failed to create order", e,
                kv("userId", order.getUserId()),
                kv("product", order.getProduct())
            );
            throw e;
        }
    }
    
    @Cacheable("orders")
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }
    
    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId);
    }
    
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    
    public Order updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        kafkaTemplate.send("order-events", "Order status updated: " + updatedOrder.getId() + " - " + status);
        return updatedOrder;
    }
    
    @KafkaListener(topics = "user-events", groupId = "order-service-group")
    public void handleUserEvents(String message) {
        // Process user events for order service
    }
}