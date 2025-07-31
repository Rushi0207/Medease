package com.medease.repository;

import com.medease.entity.HealthMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HealthMetricsRepository extends JpaRepository<HealthMetrics, Long> {
    
    Optional<HealthMetrics> findByPatientId(Long patientId);
    
    boolean existsByPatientId(Long patientId);
}