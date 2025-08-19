package com.microservices.inventory.repository;

import com.microservices.inventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    
    Optional<Product> findBySku(String sku);
    
    List<Product> findByCategory(String category);
    
    List<Product> findByQuantityLessThanEqual(Integer quantity);
    
    @Query("SELECT p FROM Product p WHERE p.name ILIKE %:name%")
    List<Product> findByNameContainingIgnoreCase(@Param("name") String name);
    
    @Query("SELECT p FROM Product p WHERE p.quantity > 0")
    List<Product> findInStockProducts();
    
    @Query("SELECT p FROM Product p WHERE p.quantity = 0")
    List<Product> findOutOfStockProducts();
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.quantity <= :threshold")
    Long countLowStockProducts(@Param("threshold") Integer threshold);
    
    @Query("SELECT SUM(p.quantity * p.price) FROM Product p")
    Double calculateTotalInventoryValue();
}