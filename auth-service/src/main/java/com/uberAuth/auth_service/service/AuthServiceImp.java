package com.uberAuth.auth_service.service;

import com.uberAuth.auth_service.dto.SignUpReqestDto;
import com.uberAuth.auth_service.dto.UserDto;
import com.uberAuth.auth_service.models.UserType;
import com.uberAuth.auth_service.models.Users;
import com.uberAuth.auth_service.repositry.UserRepositry;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImp  implements AuthServices {

    private UserRepositry userRepositry;

    private BCryptPasswordEncoder bCryptPasswordEncoder;

    public AuthServiceImp(UserRepositry userRepositry, BCryptPasswordEncoder bCryptPasswordEncoder){
        this.userRepositry = userRepositry;
        this.bCryptPasswordEncoder = bCryptPasswordEncoder;
    }
    @Override
    public UserDto signup(SignUpReqestDto signUpReqestDto) {
        Users user = Users.builder()
                .phoneNumber(signUpReqestDto.getPhoneNumber())
                .email(signUpReqestDto.getEmail())
                .name(signUpReqestDto.getName())
                .userType(UserType.USER)
                .hashedPassword(bCryptPasswordEncoder.encode(signUpReqestDto.getPassword()))
                .build();
        userRepositry.save(user);
        return UserDto.from(user);
    }

    @Override
    public UserDto signin() {
        return null;
    }
}
