package com.uberAuth.auth_service.controllers;

import com.uberAuth.auth_service.dto.SignUpReqestDto;
import com.uberAuth.auth_service.dto.SigninRequestDto;
import com.uberAuth.auth_service.dto.SigninResponseDto;
import com.uberAuth.auth_service.dto.UserDto;
import com.uberAuth.auth_service.helpers.AuthUserDetails;
import com.uberAuth.auth_service.service.AuthServices;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@AllArgsConstructor
public class AuthController {

    private final AuthServices authServices;

    private  AuthenticationManager authenticationManager;


    @PostMapping("/signup")
    public ResponseEntity<UserDto> signup(@RequestBody SignUpReqestDto signUpReqestDto){
        UserDto user = authServices.signup(signUpReqestDto);
        return  new ResponseEntity<>(user, HttpStatus.CREATED);
    }

    @PostMapping("/signin")
    public ResponseEntity<SigninResponseDto> signin(@RequestBody SigninRequestDto signinRequestDto){
        SigninResponseDto response = new SigninResponseDto();
       try {
           UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(signinRequestDto.getEmail(),signinRequestDto.getPassword());
           Authentication authentication = authenticationManager.authenticate(usernamePasswordAuthenticationToken);
           if(authentication.isAuthenticated()){
               Object principal = authentication.getPrincipal();
               response = authServices.signin((AuthUserDetails) principal);
           }
           return  new ResponseEntity<>(response, HttpStatus.CREATED);
       }
       catch (Exception e){
           response.setError(true);
           response.setErrorMessage(e.getMessage());
           return  new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
       }
    }

    @GetMapping("/test")
    public ResponseEntity<?> testing(){
            return new ResponseEntity<>("OK",HttpStatus.OK);
    }

}
