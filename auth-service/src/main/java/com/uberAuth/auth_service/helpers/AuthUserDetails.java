package com.uberAuth.auth_service.helpers;


import com.uber.entity.models.Users;
import lombok.*;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@Setter
@ToString
public class AuthUserDetails extends Users implements UserDetails {
    private final Users user;

    public AuthUserDetails(Users user) {
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(); // later map roles here
    }

    @Override
    public String getPassword() {
        return user.getHashedPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    public String getEmail() {
        return user.getEmail();
    }

}
