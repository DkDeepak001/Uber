package com.uberAuth.auth_service.service;

import com.uberAuth.auth_service.helpers.AuthUserDetails;
import com.uberAuth.auth_service.helpers.AuthDriverDetails;
import com.uberAuth.auth_service.repositry.UserRepositry;
import com.uberAuth.auth_service.repositry.DriverRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@org.springframework.context.annotation.Primary
@AllArgsConstructor
public class CompositeUserDetailsService implements UserDetailsService {
    
    private UserRepositry userRepository;
    private DriverRepository driverRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Try to load as user first
        Optional<com.uber.entity.models.Users> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isPresent()) {
            return new AuthUserDetails(optionalUser.get());
        }
        
        // If not found as user, try to load as driver
        Optional<com.uber.entity.models.Driver> optionalDriver = driverRepository.findByEmail(email);
        if (optionalDriver.isPresent()) {
            return new AuthDriverDetails(optionalDriver.get());
        }
        
        throw new UsernameNotFoundException("User or Driver not found with email: " + email);
    }
}

