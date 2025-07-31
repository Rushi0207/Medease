package com.medease.repository;

import com.medease.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    
    List<Doctor> findBySpecialtyContainingIgnoreCase(String specialty);
    
    List<Doctor> findByIsAvailableTrue();
    
    @Query("SELECT d FROM Doctor d WHERE d.specialty LIKE %:specialty% AND d.isAvailable = true")
    List<Doctor> findAvailableDoctorsBySpecialty(@Param("specialty") String specialty);
    
    @Query("SELECT d FROM Doctor d JOIN FETCH d.user WHERE d.id = :doctorId")
    Optional<Doctor> findByIdWithUser(@Param("doctorId") Long doctorId);
    
    @Query("SELECT d FROM Doctor d JOIN d.user u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.specialty) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Doctor> findByUserFirstNameContainingIgnoreCaseOrUserLastNameContainingIgnoreCaseOrSpecialtyContainingIgnoreCase(@Param("query") String query1, @Param("query") String query2, @Param("query") String query3);
}