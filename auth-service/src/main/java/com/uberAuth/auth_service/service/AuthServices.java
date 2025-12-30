package com.uberAuth.auth_service.service;

import com.uberAuth.auth_service.dto.SignUpReqestDto;
import com.uberAuth.auth_service.dto.UserDto;
import com.uberAuth.auth_service.models.Users;
import org.springframework.stereotype.Service;

public interface AuthServices {

    public UserDto signup(SignUpReqestDto signUpReqestDto);
    public UserDto signin();
}
