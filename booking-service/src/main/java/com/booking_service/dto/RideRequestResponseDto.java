package com.booking_service.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RideRequestResponseDto {
    private String requestId; // Temporary ID for tracking this ride request
    private String userId;
    private List<DriverInfoDto> nearbyDrivers;
    private String status; // "SEARCHING", "DRIVER_FOUND", "CONFIRMED", "TIMEOUT"
    private String message;
    
    @Getter
    @Setter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DriverInfoDto {
        private String driverId;
        private String driverName;
        private double latitude;
        private double longitude;
        private double distance; // Distance in km
    }
}
