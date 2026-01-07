package com.uberAuth.auth_service.helpers;

import com.uber.entity.models.Driver;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@Setter
@ToString
public class AuthDriverDetails extends Driver implements UserDetails {
    private final Driver driver;

    public AuthDriverDetails(Driver driver) {
        this.driver = driver;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(); // later map roles here
    }

    @Override
    public String getPassword() {
        return driver.getHashedPassword();
    }

    @Override
    public String getUsername() {
        return driver.getEmail();
    }

    public String getEmail() {
        return driver.getEmail();
    }
}

