package com.uberAuth.auth_service.service;

import com.uber.entity.models.Driver;
import com.uberAuth.auth_service.dto.SignUpRequestDto;
import com.uberAuth.auth_service.dto.SigninRequestDto;
import com.uberAuth.auth_service.dto.SigninResponseDto;
import com.uberAuth.auth_service.dto.DriverDto;
import com.uberAuth.auth_service.helpers.AuthDriverDetails;
import com.uberAuth.auth_service.repositry.DriverRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@AllArgsConstructor
public class DriverAuthServiceImpl implements DriverAuthService {

    private DriverRepository driverRepository;
    private BCryptPasswordEncoder bCryptPasswordEncoder;
    private JwtService jwtService;
    private AuthenticationManager authenticationManager;

    @Override
    public DriverDto signup(SignUpRequestDto signUpRequestDto) {
        String hashedPassword = bCryptPasswordEncoder.encode(signUpRequestDto.getPassword().trim());
        Driver driver = Driver.builder()
                .phoneNumber(signUpRequestDto.getPhoneNumber())
                .email(signUpRequestDto.getEmail())
                .name(signUpRequestDto.getName())
                .hashedPassword(hashedPassword)
                .rating(0.0)
                .isAvailable(false)
                .build();
        driverRepository.save(driver);
        return DriverDto.from(driver);
    }

    @Override
    public SigninResponseDto signin(SigninRequestDto signinRequestDto) {
        try {
            UsernamePasswordAuthenticationToken authenticationToken = 
                new UsernamePasswordAuthenticationToken(signinRequestDto.getEmail(), signinRequestDto.getPassword());
            Authentication authentication = authenticationManager.authenticate(authenticationToken);
            
            if (authentication.isAuthenticated()) {
                UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                Map<String, Object> payload = new HashMap<>();
                
                if (userDetails instanceof AuthDriverDetails) {
                    AuthDriverDetails driverDetails = (AuthDriverDetails) userDetails;
                    payload.put("email", driverDetails.getDriver().getEmail());
                    payload.put("id", driverDetails.getDriver().getId());
                    payload.put("type", "driver");
                } else {
                    return SigninResponseDto.builder()
                            .error(true)
                            .errorMessage("Invalid driver credentials")
                            .build();
                }
                
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

