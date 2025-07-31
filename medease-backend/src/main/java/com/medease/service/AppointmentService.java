package com.medease.service;

import com.medease.entity.Appointment;
import com.medease.entity.Doctor;
import com.medease.entity.Patient;
import com.medease.repository.AppointmentRepository;
import com.medease.repository.DoctorRepository;
import com.medease.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Transactional
    public Appointment bookAppointment(Long patientId, Long doctorId, LocalDateTime appointmentDate, 
                                     String reason, Appointment.AppointmentType type) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // Check if doctor is available
        if (!doctor.getIsAvailable()) {
            throw new RuntimeException("Doctor is not available");
        }

        // Check for conflicting appointments
        List<Appointment> conflictingAppointments = appointmentRepository
                .findByDoctorIdAndDateRange(doctorId, 
                    appointmentDate.minusMinutes(30), 
                    appointmentDate.plusMinutes(30));
        
        if (!conflictingAppointments.isEmpty()) {
            throw new RuntimeException("Doctor is not available at this time");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(appointmentDate);
        appointment.setReason(reason);
        appointment.setType(type);
        appointment.setStatus(Appointment.AppointmentStatus.SCHEDULED);

        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public List<Appointment> getUpcomingPatientAppointments(Long patientId) {
        return appointmentRepository.findUpcomingAppointmentsByPatient(patientId, LocalDateTime.now());
    }

    public Appointment getAppointmentById(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    @Transactional
    public Appointment updateAppointmentStatus(Long appointmentId, Appointment.AppointmentStatus status) {
        Appointment appointment = getAppointmentById(appointmentId);
        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }

    @Transactional
    public void cancelAppointment(Long appointmentId) {
        Appointment appointment = getAppointmentById(appointmentId);
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
    }

    @Transactional
    public Appointment addNotes(Long appointmentId, String notes) {
        Appointment appointment = getAppointmentById(appointmentId);
        appointment.setNotes(notes);
        return appointmentRepository.save(appointment);
    }
}