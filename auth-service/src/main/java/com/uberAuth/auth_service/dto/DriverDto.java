package com.uberAuth.auth_service.dto;

import com.uber.entity.models.Driver;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverDto {
    private Long id;
    private String name;
    private String email;
    private String hashedPassword;
    private String phoneNumber;
    private Double rating;
    private Boolean isAvailable;

    public static DriverDto from(Driver driver) {
        return DriverDto.builder()
                .id(driver.getId())
                .email(driver.getEmail())
                .name(driver.getName())
                .hashedPassword(driver.getHashedPassword())
                .phoneNumber(driver.getPhoneNumber())
                .rating(driver.getRating())
                .isAvailable(driver.getIsAvailable())
                .build();
    }
}

