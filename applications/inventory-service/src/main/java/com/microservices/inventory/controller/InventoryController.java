package com.microservices.inventory.controller;

import com.microservices.inventory.model.Product;
import com.microservices.inventory.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("")
@CrossOrigin(origins = "*")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/products")
    public ResponseEntity<Page<Product>> getAllProducts(Pageable pageable) {
        Page<Product> products = inventoryService.getAllProducts(pageable);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = inventoryService.getProductById(id);
        return product != null ? ResponseEntity.ok(product) : ResponseEntity.notFound().build();
    }

    @GetMapping("/products/sku/{sku}")
    public ResponseEntity<Product> getProductBySku(@PathVariable String sku) {
        Product product = inventoryService.getProductBySku(sku);
        return product != null ? ResponseEntity.ok(product) : ResponseEntity.notFound().build();
    }

    @GetMapping("/products/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        List<Product> products = inventoryService.getProductsByCategory(category);
        return ResponseEntity.ok(products);
    }

    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        Product createdProduct = inventoryService.createProduct(product);
        
        // Отправляем WebSocket уведомление о новом продукте
        messagingTemplate.convertAndSend("/topic/inventory", 
            Map.of("type", "PRODUCT_CREATED", "product", createdProduct));
        
        return ResponseEntity.ok(createdProduct);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        Product updatedProduct = inventoryService.updateProduct(id, product);
        if (updatedProduct != null) {
            messagingTemplate.convertAndSend("/topic/inventory", 
                Map.of("type", "PRODUCT_UPDATED", "product", updatedProduct));
            return ResponseEntity.ok(updatedProduct);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        boolean deleted = inventoryService.deleteProduct(id);
        if (deleted) {
            messagingTemplate.convertAndSend("/topic/inventory", 
                Map.of("type", "PRODUCT_DELETED", "productId", id));
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/products/{id}/reserve")
    public ResponseEntity<Map<String, Object>> reserveProduct(
            @PathVariable Long id, 
            @RequestBody Map<String, Integer> request) {
        
        Integer quantity = request.get("quantity");
        boolean success = inventoryService.reserveProduct(id, quantity);
        
        Map<String, Object> response = Map.of(
            "success", success,
            "productId", id,
            "reservedQuantity", quantity
        );
        
        if (success) {
            messagingTemplate.convertAndSend("/topic/inventory", 
                Map.of("type", "PRODUCT_RESERVED", "data", response));
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/products/{id}/release")
    public ResponseEntity<Map<String, Object>> releaseReservation(
            @PathVariable Long id, 
            @RequestBody Map<String, Integer> request) {
        
        Integer quantity = request.get("quantity");
        boolean success = inventoryService.releaseReservation(id, quantity);
        
        Map<String, Object> response = Map.of(
            "success", success,
            "productId", id,
            "releasedQuantity", quantity
        );
        
        if (success) {
            messagingTemplate.convertAndSend("/topic/inventory", 
                Map.of("type", "RESERVATION_RELEASED", "data", response));
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/products/{id}/availability")
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @PathVariable Long id, 
            @RequestParam Integer quantity) {
        
        boolean available = inventoryService.checkAvailability(id, quantity);
        Product product = inventoryService.getProductById(id);
        
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        
        Map<String, Object> response = Map.of(
            "available", available,
            "productId", id,
            "requestedQuantity", quantity,
            "availableQuantity", product.getAvailableQuantity(),
            "totalQuantity", product.getQuantity(),
            "reservedQuantity", product.getReservedQuantity()
        );
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/products/low-stock")
    public ResponseEntity<List<Product>> getLowStockProducts(@RequestParam(defaultValue = "10") Integer threshold) {
        List<Product> lowStockProducts = inventoryService.getLowStockProducts(threshold);
        return ResponseEntity.ok(lowStockProducts);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getInventoryStats() {
        Map<String, Object> stats = inventoryService.getInventoryStatistics();
        return ResponseEntity.ok(stats);
    }

    // Stock management endpoints expected by integration tests
    @PostMapping("/stock/reserve")
    public ResponseEntity<Product> reserveStock(@RequestBody Map<String, Object> request) {
        String sku = (String) request.get("sku");
        Integer quantity = (Integer) request.get("quantity");
        Product product = inventoryService.reserveStock(sku, quantity);
        return ResponseEntity.ok(product);
    }

    @PostMapping("/stock/restore")
    public ResponseEntity<Product> restoreStock(@RequestBody Map<String, Object> request) {
        String sku = (String) request.get("sku");
        Integer quantity = (Integer) request.get("quantity");
        Product product = inventoryService.restoreStock(sku, quantity);
        return ResponseEntity.ok(product);
    }

    // Additional endpoints for searching and filtering  
    @GetMapping("/products/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam(required = false) String name) {
        List<Product> products = inventoryService.searchProductsByName(name);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/products/in-stock")
    public ResponseEntity<List<Product>> getInStockProducts() {
        List<Product> products = inventoryService.getInStockProducts();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/products/out-of-stock")
    public ResponseEntity<List<Product>> getOutOfStockProducts() {
        List<Product> products = inventoryService.getOutOfStockProducts();
        return ResponseEntity.ok(products);
    }
}