package com.uberAuth.auth_service.service;

import com.uber.entity.models.Users;
import com.uberAuth.auth_service.dto.SignUpRequestDto;
import com.uberAuth.auth_service.dto.SigninRequestDto;
import com.uberAuth.auth_service.dto.SigninResponseDto;
import com.uberAuth.auth_service.dto.UserDto;
import com.uberAuth.auth_service.helpers.AuthUserDetails;
import com.uberAuth.auth_service.repositry.UserRepositry;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@AllArgsConstructor
public class AuthServiceImp implements AuthService {

    private UserRepositry userRepositry;
    private BCryptPasswordEncoder bCryptPasswordEncoder;
    private JwtService jwtService;
    private AuthenticationManager authenticationManager;

    @Override
    public UserDto signup(SignUpRequestDto signUpRequestDto) {
        String hashedPassword = bCryptPasswordEncoder.encode(signUpRequestDto.getPassword().trim());
        Users user = Users.builder()
                .phoneNumber(signUpRequestDto.getPhoneNumber())
                .email(signUpRequestDto.getEmail())
                .name(signUpRequestDto.getName())
                .hashedPassword(hashedPassword)
                .build();
        userRepositry.save(user);
        return UserDto.from(user);
    }

    @Override
    public SigninResponseDto signin(SigninRequestDto signinRequestDto) {
        try {
            UsernamePasswordAuthenticationToken authenticationToken = 
                new UsernamePasswordAuthenticationToken(signinRequestDto.getEmail(), signinRequestDto.getPassword());
            Authentication authentication = authenticationManager.authenticate(authenticationToken);
            
            if (authentication.isAuthenticated()) {
                AuthUserDetails userDetails = (AuthUserDetails) authentication.getPrincipal();
                Map<String, Object> payload = new HashMap<>();
                payload.put("email", userDetails.getUser().getEmail());
                payload.put("id", userDetails.getUser().getId());
                payload.put("type", "user");
        String token = jwtService.generatTokenString(payload);
        return SigninResponseDto.builder().accesToken(token).build();
            }
            
            return SigninResponseDto.builder()
                    .error(true)
                    .errorMessage("Authentication failed")
                    .build();
        } catch (Exception e) {
            return SigninResponseDto.builder()
                    .error(true)
                    .errorMessage(e.getMessage())
                    .build();
        }
    }
}
