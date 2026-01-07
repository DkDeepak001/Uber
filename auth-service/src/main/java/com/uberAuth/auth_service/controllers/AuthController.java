package com.uberAuth.auth_service.controllers;

import com.uberAuth.auth_service.dto.SignUpRequestDto;
import com.uberAuth.auth_service.dto.SigninRequestDto;
import com.uberAuth.auth_service.dto.SigninResponseDto;
import com.uberAuth.auth_service.dto.UserDto;
import com.uberAuth.auth_service.service.AuthService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@AllArgsConstructor
public class AuthController {

    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<UserDto> signup(@RequestBody SignUpRequestDto signUpRequestDto) {
        try {
            UserDto user = authService.signup(signUpRequestDto);
            return new ResponseEntity<>(user, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<SigninResponseDto> signin(@RequestBody SigninRequestDto signinRequestDto) {
        try {
            SigninResponseDto response = authService.signin(signinRequestDto);
            if (response.getError() != null && response.getError()) {
                return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
           }
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            SigninResponseDto errorResponse = SigninResponseDto.builder()
                    .error(true)
                    .errorMessage(e.getMessage())
                    .build();
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
       }
    }

    @GetMapping("/me")
    public ResponseEntity<UserDetails> me(@AuthenticationPrincipal UserDetails user) {
        return new ResponseEntity<>(user, HttpStatus.OK);
    }
}
