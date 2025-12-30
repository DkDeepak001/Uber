package com.uberAuth.auth_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SignUpReqestDto {

    private String name;
    private String email;
    private String password;
    private String phoneNumber;
}
