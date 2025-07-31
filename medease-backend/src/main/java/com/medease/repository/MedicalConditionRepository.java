package com.medease.repository;

import com.medease.entity.MedicalCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalConditionRepository extends JpaRepository<MedicalCondition, Long> {
    
    List<MedicalCondition> findByPatientId(Long patientId);
    
    List<MedicalCondition> findByPatientIdAndIsActiveTrue(Long patientId);
}