package com.uberAuth.auth_service.service;

import com.uber.entity.models.Users;
import com.uberAuth.auth_service.helpers.AuthUserDetails;
import com.uberAuth.auth_service.repositry.UserRepositry;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class UserDetailsServiceImp implements UserDetailsService {
    private UserRepositry userRepositry;
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Optional<Users> optionalUser = userRepositry.findByEmail(email);
        if(optionalUser.isEmpty()) throw  new UsernameNotFoundException("User Not found");
        Users user = optionalUser.get();
        return new AuthUserDetails(user);
    }
}
