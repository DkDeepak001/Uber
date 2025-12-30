package com.uberAuth.auth_service.controllers;

import com.uberAuth.auth_service.dto.SignUpReqestDto;
import com.uberAuth.auth_service.dto.UserDto;
import com.uberAuth.auth_service.service.AuthServices;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@AllArgsConstructor
public class AuthController {

    private final AuthServices authServices;


    @PostMapping("/signup")
    public ResponseEntity<UserDto> signup(@RequestBody SignUpReqestDto signUpReqestDto){
        UserDto user = authServices.signup(signUpReqestDto);
        return  new ResponseEntity<>(user, HttpStatus.CREATED);
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signin(){
        return  new ResponseEntity<>("OK", HttpStatus.CREATED);
    }

}
