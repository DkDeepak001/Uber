package com.uber.location_service.location_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RandomizeDriversRequestDto {
    private double latitude;
    private double longitude;
    private int minDrivers = 2;
    private int maxDrivers = 10;
    private double radiusKm = 5.0; // Default 5km radius
}
