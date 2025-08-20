package com.microservices.inventory.service;

import com.microservices.inventory.model.Product;
import com.microservices.inventory.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional
public class InventoryService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id).orElse(null);
    }
    
    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    public Product getProductBySku(String sku) {
        return productRepository.findBySku(sku).orElse(null);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public List<Product> getLowStockProducts(int threshold) {
        return productRepository.findByQuantityLessThanEqual(threshold);
    }

    public Product createProduct(Product product) {
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());
        
        Product savedProduct = productRepository.save(product);
        
        // Send event to Kafka
        sendInventoryEvent("PRODUCT_CREATED", savedProduct);
        
        // Send real-time update via WebSocket
        messagingTemplate.convertAndSend("/topic/inventory", 
            new InventoryUpdateEvent("PRODUCT_CREATED", savedProduct));
        
        return savedProduct;
    }

    public Product updateProduct(Long id, Product productUpdate) {
        return productRepository.findById(id)
            .map(product -> {
                if (productUpdate.getName() != null) {
                    product.setName(productUpdate.getName());
                }
                if (productUpdate.getDescription() != null) {
                    product.setDescription(productUpdate.getDescription());
                }
                if (productUpdate.getCategory() != null) {
                    product.setCategory(productUpdate.getCategory());
                }
                if (productUpdate.getPrice() != null) {
                    product.setPrice(productUpdate.getPrice());
                }
                if (productUpdate.getQuantity() != null) {
                    product.setQuantity(productUpdate.getQuantity());
                }
                product.setUpdatedAt(LocalDateTime.now());
                
                Product savedProduct = productRepository.save(product);
                
                // Send event to Kafka
                sendInventoryEvent("PRODUCT_UPDATED", savedProduct);
                
                // Send real-time update via WebSocket
                messagingTemplate.convertAndSend("/topic/inventory", 
                    new InventoryUpdateEvent("PRODUCT_UPDATED", savedProduct));
                
                return savedProduct;
            })
            .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    public boolean deleteProduct(Long id) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            productRepository.deleteById(id);
            
            // Send event to Kafka
            sendInventoryEvent("PRODUCT_DELETED", product);
            
            // Send real-time update via WebSocket
            messagingTemplate.convertAndSend("/topic/inventory", 
                new InventoryUpdateEvent("PRODUCT_DELETED", product));
            return true;
        }
        return false;
    }

    public Product reserveStock(String sku, Integer quantity) {
        return productRepository.findBySku(sku)
            .map(product -> {
                if (product.getQuantity() < quantity) {
                    throw new RuntimeException("Insufficient stock for product: " + sku);
                }
                
                product.setQuantity(product.getQuantity() - quantity);
                product.setUpdatedAt(LocalDateTime.now());
                
                Product savedProduct = productRepository.save(product);
                
                // Send event to Kafka
                sendInventoryEvent("STOCK_RESERVED", savedProduct);
                
                // Send real-time update via WebSocket
                messagingTemplate.convertAndSend("/topic/inventory", 
                    new InventoryUpdateEvent("STOCK_RESERVED", savedProduct));
                
                return savedProduct;
            })
            .orElseThrow(() -> new RuntimeException("Product not found with sku: " + sku));
    }

    public Product restoreStock(String sku, Integer quantity) {
        return productRepository.findBySku(sku)
            .map(product -> {
                product.setQuantity(product.getQuantity() + quantity);
                product.setUpdatedAt(LocalDateTime.now());
                
                Product savedProduct = productRepository.save(product);
                
                // Send event to Kafka
                sendInventoryEvent("STOCK_RESTORED", savedProduct);
                
                // Send real-time update via WebSocket
                messagingTemplate.convertAndSend("/topic/inventory", 
                    new InventoryUpdateEvent("STOCK_RESTORED", savedProduct));
                
                return savedProduct;
            })
            .orElseThrow(() -> new RuntimeException("Product not found with sku: " + sku));
    }

    private void sendInventoryEvent(String eventType, Product product) {
        try {
            InventoryEvent event = new InventoryEvent(eventType, product);
            kafkaTemplate.send("inventory-events", event);
        } catch (Exception e) {
            // Log error but don't fail the operation
            System.err.println("Failed to send inventory event: " + e.getMessage());
        }
    }

    // Event classes
    public static class InventoryEvent {
        private String eventType;
        private Product product;
        private LocalDateTime timestamp;

        public InventoryEvent(String eventType, Product product) {
            this.eventType = eventType;
            this.product = product;
            this.timestamp = LocalDateTime.now();
        }

        // Getters and setters
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public Product getProduct() { return product; }
        public void setProduct(Product product) { this.product = product; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }

    public static class InventoryUpdateEvent {
        private String eventType;
        private Product product;
        private LocalDateTime timestamp;

        public InventoryUpdateEvent(String eventType, Product product) {
            this.eventType = eventType;
            this.product = product;
            this.timestamp = LocalDateTime.now();
        }

        // Getters and setters
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public Product getProduct() { return product; }
        public void setProduct(Product product) { this.product = product; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }
    
    // Additional methods needed by controller
    public boolean reserveProduct(Long id, Integer quantity) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            if (product.isAvailable(quantity)) {
                product.setReservedQuantity(product.getReservedQuantity() + quantity);
                productRepository.save(product);
                return true;
            }
        }
        return false;
    }
    
    public boolean releaseReservation(Long id, Integer quantity) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            if (product.getReservedQuantity() >= quantity) {
                product.setReservedQuantity(product.getReservedQuantity() - quantity);
                productRepository.save(product);
                return true;
            }
        }
        return false;
    }
    
    public boolean checkAvailability(Long id, Integer quantity) {
        Optional<Product> productOpt = productRepository.findById(id);
        return productOpt.map(product -> product.isAvailable(quantity)).orElse(false);
    }
    
    public Map<String, Object> getInventoryStatistics() {
        Map<String, Object> stats = new HashMap<>();
        long totalProducts = productRepository.count();
        List<Product> allProducts = productRepository.findAll();
        
        long lowStockCount = allProducts.stream()
            .mapToInt(p -> p.getAvailableQuantity())
            .filter(q -> q < 10)
            .count();
            
        long totalQuantity = allProducts.stream()
            .mapToInt(Product::getQuantity)
            .sum();
            
        long totalReserved = allProducts.stream()
            .mapToInt(Product::getReservedQuantity)
            .sum();
        
        stats.put("totalProducts", totalProducts);
        stats.put("lowStockCount", lowStockCount);
        stats.put("totalQuantity", totalQuantity);
        stats.put("totalReserved", totalReserved);
        stats.put("totalAvailable", totalQuantity - totalReserved);
        
        return stats;
    }
}