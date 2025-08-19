package com.microservices.audit.repository;

import com.microservices.audit.model.AuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {
    
    List<AuditEvent> findByServiceOrderByTimestampDesc(String service);
    
    List<AuditEvent> findByUserIdOrderByTimestampDesc(String userId);
    
    List<AuditEvent> findByEntityTypeOrderByTimestampDesc(String entityType);
    
    List<AuditEvent> findByActionOrderByTimestampDesc(String action);
    
    List<AuditEvent> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    List<AuditEvent> findByActionContainingIgnoreCaseOrderByTimestampDesc(String action);
    
    Page<AuditEvent> findByServiceOrderByTimestampDesc(String service, Pageable pageable);
    
    Page<AuditEvent> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);
    
    Long countByService(String service);
    
    Long countByUserId(String userId);
    
    Long countByAction(String action);
    
    @Query("SELECT COUNT(a) FROM AuditEvent a WHERE a.timestamp >= :startDate AND a.timestamp <= :endDate")
    Long countByTimestampBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT a.service, COUNT(a) FROM AuditEvent a GROUP BY a.service ORDER BY COUNT(a) DESC")
    List<Object[]> getEventCountByService();
    
    @Query("SELECT a.action, COUNT(a) FROM AuditEvent a GROUP BY a.action ORDER BY COUNT(a) DESC")
    List<Object[]> getEventCountByAction();
    
    @Query("SELECT DATE(a.timestamp), COUNT(a) FROM AuditEvent a " +
           "WHERE a.timestamp >= :startDate AND a.timestamp <= :endDate " +
           "GROUP BY DATE(a.timestamp) ORDER BY DATE(a.timestamp)")
    List<Object[]> getDailyEventCounts(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}