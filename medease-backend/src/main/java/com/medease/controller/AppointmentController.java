package com.medease.controller;

import com.medease.entity.Appointment;
import com.medease.security.UserPrincipal;
import com.medease.service.AppointmentService;
import com.medease.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private PatientService patientService;

    @PostMapping("/book")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Appointment> bookAppointment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> request) {
        try {
            Long doctorId = Long.valueOf(request.get("doctorId").toString());
            String appointmentDateStr = request.get("appointmentDate").toString();
            String appointmentTimeStr = request.get("appointmentTime").toString();
            String reason = request.get("reason") != null ? request.get("reason").toString() : "";
            String typeStr = request.get("type") != null ? request.get("type").toString() : "CONSULTATION";

            // Parse date and time
            LocalDateTime appointmentDateTime = LocalDateTime.parse(appointmentDateStr + "T" + appointmentTimeStr);
            Appointment.AppointmentType type = Appointment.AppointmentType.valueOf(typeStr.toUpperCase());

            // Get patient
            var patient = patientService.getPatientByUserId(userPrincipal.getId());

            Appointment appointment = appointmentService.bookAppointment(
                    patient.getId(), doctorId, appointmentDateTime, reason, type);
            
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/patient")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<Appointment>> getPatientAppointments(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            var patient = patientService.getPatientByUserId(userPrincipal.getId());
            List<Appointment> appointments = appointmentService.getPatientAppointments(patient.getId());
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/patient/upcoming")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<Appointment>> getUpcomingPatientAppointments(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            var patient = patientService.getPatientByUserId(userPrincipal.getId());
            List<Appointment> appointments = appointmentService.getUpcomingPatientAppointments(patient.getId());
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.getAppointmentById(id);
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Appointment> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String statusStr = request.get("status");
            Appointment.AppointmentStatus status = Appointment.AppointmentStatus.valueOf(statusStr.toUpperCase());
            Appointment appointment = appointmentService.updateAppointmentStatus(id, status);
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Void> cancelAppointment(@PathVariable Long id) {
        try {
            appointmentService.cancelAppointment(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/notes")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Appointment> addNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String notes = request.get("notes");
            Appointment appointment = appointmentService.addNotes(id, notes);
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}