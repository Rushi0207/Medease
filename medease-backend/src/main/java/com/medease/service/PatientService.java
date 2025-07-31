package com.medease.service;

import com.medease.entity.HealthMetrics;
import com.medease.entity.MedicalCondition;
import com.medease.entity.Patient;
import com.medease.repository.HealthMetricsRepository;
import com.medease.repository.MedicalConditionRepository;
import com.medease.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private HealthMetricsRepository healthMetricsRepository;

    @Autowired
    private MedicalConditionRepository medicalConditionRepository;

    public Patient getPatientByUserId(Long userId) {
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
    }

    public Patient getPatientById(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
    }

    @Transactional
    public HealthMetrics updateHealthMetrics(Long patientId, HealthMetrics healthMetrics) {
        Patient patient = getPatientById(patientId);
        
        HealthMetrics existingMetrics = healthMetricsRepository.findByPatientId(patientId)
                .orElse(new HealthMetrics());
        
        existingMetrics.setPatient(patient);
        existingMetrics.setHeight(healthMetrics.getHeight());
        existingMetrics.setWeight(healthMetrics.getWeight());
        existingMetrics.setBloodPressureSystolic(healthMetrics.getBloodPressureSystolic());
        existingMetrics.setBloodPressureDiastolic(healthMetrics.getBloodPressureDiastolic());
        existingMetrics.setHeartRate(healthMetrics.getHeartRate());
        existingMetrics.setBloodSugar(healthMetrics.getBloodSugar());
        existingMetrics.setCholesterol(healthMetrics.getCholesterol());
        existingMetrics.setTemperature(healthMetrics.getTemperature());
        
        return healthMetricsRepository.save(existingMetrics);
    }

    public HealthMetrics getHealthMetrics(Long patientId) {
        return healthMetricsRepository.findByPatientId(patientId)
                .orElse(null);
    }

    public List<MedicalCondition> getPatientConditions(Long patientId) {
        return medicalConditionRepository.findByPatientId(patientId);
    }

    public List<MedicalCondition> getActiveConditions(Long patientId) {
        return medicalConditionRepository.findByPatientIdAndIsActiveTrue(patientId);
    }

    @Transactional
    public MedicalCondition addCondition(Long patientId, MedicalCondition condition) {
        Patient patient = getPatientById(patientId);
        condition.setPatient(patient);
        return medicalConditionRepository.save(condition);
    }

    @Transactional
    public MedicalCondition updateCondition(Long conditionId, MedicalCondition updatedCondition) {
        MedicalCondition condition = medicalConditionRepository.findById(conditionId)
                .orElseThrow(() -> new RuntimeException("Medical condition not found"));
        
        condition.setName(updatedCondition.getName());
        condition.setDescription(updatedCondition.getDescription());
        condition.setSeverity(updatedCondition.getSeverity());
        condition.setIsActive(updatedCondition.getIsActive());
        condition.setMedications(updatedCondition.getMedications());
        
        return medicalConditionRepository.save(condition);
    }

    @Transactional
    public void deleteCondition(Long conditionId) {
        medicalConditionRepository.deleteById(conditionId);
    }
}