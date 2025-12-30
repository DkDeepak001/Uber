package com.uberAuth.auth_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SigninResponseDto {
    private String accesToken;
    private  String expiresAt;
}
