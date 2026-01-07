package com.uberAuth.auth_service.dto;

import com.uber.entity.models.Users;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private  Long id;

    private String name;

    private String email;

    private String hashedPassword;

    private  String phoneNumber;

    public static UserDto from(Users U) {
        return  UserDto.builder()
                .id(U.getId())
                .email(U.getEmail())
                .name(U.getName())
                .hashedPassword(U.getHashedPassword())
                .phoneNumber(U.getPhoneNumber())
                .build();
    }
}
