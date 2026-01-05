package com.uberAuth.auth_service.service;

import com.uber.entity.models.Users;
import com.uberAuth.auth_service.dto.SignUpReqestDto;
import com.uberAuth.auth_service.dto.SigninRequestDto;
import com.uberAuth.auth_service.dto.SigninResponseDto;
import com.uberAuth.auth_service.dto.UserDto;
import com.uberAuth.auth_service.helpers.AuthUserDetails;
import com.uberAuth.auth_service.repositry.UserRepositry;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@AllArgsConstructor
public class AuthServiceImp  implements AuthServices {

    private UserRepositry userRepositry;

    private BCryptPasswordEncoder bCryptPasswordEncoder;

    private JwtService jwtService;

    @Override
    public UserDto signup(SignUpReqestDto signUpReqestDto) {
        String hashedPassword = bCryptPasswordEncoder.encode(signUpReqestDto.getPassword().trim());
        Users user = Users.builder()
                .phoneNumber(signUpReqestDto.getPhoneNumber())
                .email(signUpReqestDto.getEmail())
                .name(signUpReqestDto.getName())
                .hashedPassword(hashedPassword)
                .build();
        userRepositry.save(user);
        return UserDto.from(user);
    }

    @Override
    public SigninResponseDto signin(AuthUserDetails userDetails) {
        Map<String,Object> payload = new HashMap<>();
        payload.put("email",userDetails.getUser().getEmail());
        payload.put("id",userDetails.getUser().getId());
        String token = jwtService.generatTokenString(payload);
        return SigninResponseDto.builder().accesToken(token).build();
    }
}
