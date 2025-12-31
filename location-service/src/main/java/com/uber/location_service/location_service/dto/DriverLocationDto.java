package com.uber.location_service.location_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DriverLocationDto {
    private String driverId;
    private double latitude;
    private double longitude;
}
