package com.uberAuth.auth_service.service;

import com.uberAuth.auth_service.dto.SignUpReqestDto;
import com.uberAuth.auth_service.dto.SigninRequestDto;
import com.uberAuth.auth_service.dto.SigninResponseDto;
import com.uberAuth.auth_service.dto.UserDto;
import com.uberAuth.auth_service.models.UserType;
import com.uberAuth.auth_service.models.Users;
import com.uberAuth.auth_service.repositry.UserRepositry;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

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
        String hashedPassword = bCryptPasswordEncoder.encode(signUpReqestDto.getPassword().trim());
        Users user = Users.builder()
                .phoneNumber(signUpReqestDto.getPhoneNumber())
                .email(signUpReqestDto.getEmail())
                .name(signUpReqestDto.getName())
                .userType(UserType.USER)
                .hashedPassword(hashedPassword)
                .build();
        userRepositry.save(user);
        return UserDto.from(user);
    }

    @Override
    public SigninResponseDto signin(SigninRequestDto signinRequestDto) {
        Optional<Users> optionalUser = userRepositry.findByEmail(signinRequestDto.getEmail());
        if(optionalUser.isPresent()){
            Boolean isMatched = bCryptPasswordEncoder.matches(signinRequestDto.getPassword(),optionalUser.get().getHashedPassword());
            if(isMatched) System.out.println(optionalUser.get().toString() + " Password Matched" );
        }
        return null;
    }
}
