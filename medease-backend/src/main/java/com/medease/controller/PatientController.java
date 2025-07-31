package com.medease.controller;

import com.medease.entity.HealthMetrics;
import com.medease.entity.MedicalCondition;
import com.medease.entity.Patient;
import com.medease.security.UserPrincipal;
import com.medease.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patients")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PatientController {

    @Autowired
    private PatientService patientService;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Patient> getProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            Patient patient = patientService.getPatientByUserId(userPrincipal.getId());
            return ResponseEntity.ok(patient);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/health-metrics")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<HealthMetrics> getHealthMetrics(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            Patient patient = patientService.getPatientByUserId(userPrincipal.getId());
            HealthMetrics metrics = patientService.getHealthMetrics(patient.getId());
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/health-metrics")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<HealthMetrics> updateHealthMetrics(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody HealthMetrics healthMetrics) {
        try {
            Patient patient = patientService.getPatientByUserId(userPrincipal.getId());
            HealthMetrics updated = patientService.updateHealthMetrics(patient.getId(), healthMetrics);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/conditions")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<MedicalCondition>> getConditions(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            Patient patient = patientService.getPatientByUserId(userPrincipal.getId());
            List<MedicalCondition> conditions = patientService.getPatientConditions(patient.getId());
            return ResponseEntity.ok(conditions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/conditions")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<MedicalCondition> addCondition(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody MedicalCondition condition) {
        try {
            Patient patient = patientService.getPatientByUserId(userPrincipal.getId());
            MedicalCondition added = patientService.addCondition(patient.getId(), condition);
            return ResponseEntity.ok(added);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/conditions/{conditionId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<MedicalCondition> updateCondition(
            @PathVariable Long conditionId,
            @RequestBody MedicalCondition condition) {
        try {
            MedicalCondition updated = patientService.updateCondition(conditionId, condition);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/conditions/{conditionId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Void> deleteCondition(@PathVariable Long conditionId) {
        try {
            patientService.deleteCondition(conditionId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}