package com.uberAuth.auth_service.service;

import com.uber.entity.models.Driver;
import com.uberAuth.auth_service.helpers.AuthDriverDetails;
import com.uberAuth.auth_service.repositry.DriverRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class DriverDetailsServiceImp implements UserDetailsService {
    private DriverRepository driverRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Optional<Driver> optionalDriver = driverRepository.findByEmail(email);
        if (optionalDriver.isEmpty()) throw new UsernameNotFoundException("Driver Not found");
        Driver driver = optionalDriver.get();
        return new AuthDriverDetails(driver);
    }
}

