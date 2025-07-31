package com.medease.service;

import com.medease.dto.AuthRequest;
import com.medease.dto.AuthResponse;
import com.medease.dto.RegisterRequest;
import com.medease.entity.Patient;
import com.medease.entity.Role;
import com.medease.entity.User;
import com.medease.repository.PatientRepository;
import com.medease.repository.RoleRepository;
import com.medease.repository.UserRepository;
import com.medease.security.JwtUtils;
import com.medease.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        // Create new user
        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());

        // Set default role as PATIENT
        Set<Role> roles = new HashSet<>();
        Role patientRole = roleRepository.findByName(Role.RoleName.ROLE_PATIENT)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        roles.add(patientRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // Create patient profile
        Patient patient = new Patient(savedUser);
        patientRepository.save(patient);

        // Generate JWT token
        String jwt = jwtUtils.generateJwtToken(savedUser.getEmail());

        Set<String> roleNames = roles.stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        return new AuthResponse(jwt, savedUser.getId(), savedUser.getEmail(), 
                               savedUser.getFirstName(), savedUser.getLastName(), roleNames);
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(request.getEmail());

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        
        Set<String> roleNames = userPrincipal.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .collect(Collectors.toSet());

        return new AuthResponse(jwt, userPrincipal.getId(), userPrincipal.getEmail(), 
                               userPrincipal.getFirstName(), userPrincipal.getLastName(), roleNames);
    }
}