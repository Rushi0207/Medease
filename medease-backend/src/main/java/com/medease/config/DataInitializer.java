package com.medease.config;

import com.medease.entity.*;
import com.medease.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private HealthMetricsRepository healthMetricsRepository;

    @Autowired
    private MedicalConditionRepository medicalConditionRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeRoles();
        initializeSampleData();
    }

    private void initializeRoles() {
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role(Role.RoleName.ROLE_PATIENT));
            roleRepository.save(new Role(Role.RoleName.ROLE_DOCTOR));
            roleRepository.save(new Role(Role.RoleName.ROLE_ADMIN));
        }
    }

    private void initializeSampleData() {
        if (userRepository.count() == 0) {
            // Create sample patient
            createSamplePatient();
            
            // Create sample doctors
            createSampleDoctors();
        }
    }

    private void createSamplePatient() {
        Role patientRole = roleRepository.findByName(Role.RoleName.ROLE_PATIENT).orElseThrow();
        
        User patientUser = new User();
        patientUser.setFirstName("John");
        patientUser.setLastName("Doe");
        patientUser.setEmail("patient@medease.com");
        patientUser.setPhone("1234567890");
        patientUser.setPassword(passwordEncoder.encode("password123"));
        patientUser.setDateOfBirth(LocalDate.of(1990, 5, 15));
        patientUser.setGender(User.Gender.MALE);
        
        Set<Role> roles = new HashSet<>();
        roles.add(patientRole);
        patientUser.setRoles(roles);
        
        User savedPatientUser = userRepository.save(patientUser);
        
        // Create patient profile
        Patient patient = new Patient(savedPatientUser);
        Patient savedPatient = patientRepository.save(patient);
        
        // Create health metrics
        HealthMetrics healthMetrics = new HealthMetrics();
        healthMetrics.setPatient(savedPatient);
        healthMetrics.setHeight(175.0);
        healthMetrics.setWeight(70.0);
        healthMetrics.setHeartRate(72);
        healthMetrics.setBloodPressureSystolic(120);
        healthMetrics.setBloodPressureDiastolic(80);
        healthMetrics.setBloodSugar(95.0);
        healthMetrics.setCholesterol(180.0);
        healthMetrics.setTemperature(98.6);
        healthMetricsRepository.save(healthMetrics);
        
        // Create sample medical condition
        MedicalCondition condition = new MedicalCondition();
        condition.setPatient(savedPatient);
        condition.setName("Hypertension");
        condition.setDescription("High blood pressure");
        condition.setSeverity(MedicalCondition.Severity.MEDIUM);
        condition.setDiagnosedDate(LocalDate.of(2023, 1, 15));
        condition.setIsActive(true);
        condition.setMedications("Lisinopril 10mg daily");
        medicalConditionRepository.save(condition);
    }

    private void createSampleDoctors() {
        Role doctorRole = roleRepository.findByName(Role.RoleName.ROLE_DOCTOR).orElseThrow();
        
        // Doctor 1 - Cardiologist
        User doctor1User = new User();
        doctor1User.setFirstName("Dr. Sarah");
        doctor1User.setLastName("Johnson");
        doctor1User.setEmail("dr.johnson@medease.com");
        doctor1User.setPhone("9876543210");
        doctor1User.setPassword(passwordEncoder.encode("doctor123"));
        doctor1User.setDateOfBirth(LocalDate.of(1980, 3, 20));
        doctor1User.setGender(User.Gender.FEMALE);
        
        Set<Role> doctorRoles = new HashSet<>();
        doctorRoles.add(doctorRole);
        doctor1User.setRoles(doctorRoles);
        
        User savedDoctor1User = userRepository.save(doctor1User);
        
        Doctor doctor1 = new Doctor(savedDoctor1User, "Cardiology");
        doctor1.setQualifications("MD, FACC");
        doctor1.setExperienceYears(15);
        doctor1.setHospitalAffiliation("City General Hospital");
        doctor1.setLicenseNumber("MD12345");
        doctor1.setConsultationFee(new BigDecimal("200.00"));
        doctor1.setBio("Experienced cardiologist specializing in heart disease prevention and treatment.");
        doctor1.setRating(4.8);
        doctor1.setTotalReviews(150);
        doctor1.setIsAvailable(true);
        doctorRepository.save(doctor1);
        
        // Doctor 2 - General Practitioner
        User doctor2User = new User();
        doctor2User.setFirstName("Dr. Michael");
        doctor2User.setLastName("Smith");
        doctor2User.setEmail("dr.smith@medease.com");
        doctor2User.setPhone("9876543211");
        doctor2User.setPassword(passwordEncoder.encode("doctor123"));
        doctor2User.setDateOfBirth(LocalDate.of(1975, 8, 10));
        doctor2User.setGender(User.Gender.MALE);
        doctor2User.setRoles(doctorRoles);
        
        User savedDoctor2User = userRepository.save(doctor2User);
        
        Doctor doctor2 = new Doctor(savedDoctor2User, "General Practice");
        doctor2.setQualifications("MD, MRCGP");
        doctor2.setExperienceYears(20);
        doctor2.setHospitalAffiliation("Community Health Center");
        doctor2.setLicenseNumber("MD12346");
        doctor2.setConsultationFee(new BigDecimal("150.00"));
        doctor2.setBio("Family medicine physician providing comprehensive primary care.");
        doctor2.setRating(4.6);
        doctor2.setTotalReviews(200);
        doctor2.setIsAvailable(true);
        doctorRepository.save(doctor2);
        
        // Doctor 3 - Dermatologist
        User doctor3User = new User();
        doctor3User.setFirstName("Dr. Emily");
        doctor3User.setLastName("Davis");
        doctor3User.setEmail("dr.davis@medease.com");
        doctor3User.setPhone("9876543212");
        doctor3User.setPassword(passwordEncoder.encode("doctor123"));
        doctor3User.setDateOfBirth(LocalDate.of(1985, 12, 5));
        doctor3User.setGender(User.Gender.FEMALE);
        doctor3User.setRoles(doctorRoles);
        
        User savedDoctor3User = userRepository.save(doctor3User);
        
        Doctor doctor3 = new Doctor(savedDoctor3User, "Dermatology");
        doctor3.setQualifications("MD, FAAD");
        doctor3.setExperienceYears(10);
        doctor3.setHospitalAffiliation("Skin Care Clinic");
        doctor3.setLicenseNumber("MD12347");
        doctor3.setConsultationFee(new BigDecimal("180.00"));
        doctor3.setBio("Board-certified dermatologist specializing in skin conditions and cosmetic procedures.");
        doctor3.setRating(4.9);
        doctor3.setTotalReviews(120);
        doctor3.setIsAvailable(true);
        doctorRepository.save(doctor3);
    }
}