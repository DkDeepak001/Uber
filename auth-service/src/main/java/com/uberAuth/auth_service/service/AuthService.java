package com.uberAuth.auth_service.service;

import com.uberAuth.auth_service.dto.SignUpRequestDto;
import com.uberAuth.auth_service.dto.SigninRequestDto;
import com.uberAuth.auth_service.dto.SigninResponseDto;
import com.uberAuth.auth_service.dto.UserDto;

public interface AuthService {

    UserDto signup(SignUpRequestDto signUpRequestDto);
    SigninResponseDto signin(SigninRequestDto signinRequestDto);
}
