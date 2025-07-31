package com.medease.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patients")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @OneToOne(mappedBy = "patient", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private HealthMetrics healthMetrics;

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MedicalCondition> conditions = new ArrayList<>();

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Appointment> appointments = new ArrayList<>();

    // Constructors
    public Patient() {}

    public Patient(User user) {
        this.user = user;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public HealthMetrics getHealthMetrics() { return healthMetrics; }
    public void setHealthMetrics(HealthMetrics healthMetrics) { 
        this.healthMetrics = healthMetrics;
        if (healthMetrics != null) {
            healthMetrics.setPatient(this);
        }
    }

    public List<MedicalCondition> getConditions() { return conditions; }
    public void setConditions(List<MedicalCondition> conditions) { this.conditions = conditions; }

    public List<Appointment> getAppointments() { return appointments; }
    public void setAppointments(List<Appointment> appointments) { this.appointments = appointments; }

    // Helper methods
    public void addCondition(MedicalCondition condition) {
        conditions.add(condition);
        condition.setPatient(this);
    }

    public void removeCondition(MedicalCondition condition) {
        conditions.remove(condition);
        condition.setPatient(null);
    }
}