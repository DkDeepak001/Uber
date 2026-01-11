package com.booking_service.dto;

import lombok.*;

import java.sql.Date;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RideRequestDto {
    private String requestId;
    private String userId;
    private double pickupLatitude;
    private double pickupLongitude;
    private double dropoffLatitude;
    private double dropoffLongitude;
    private Date pickupTime;
    private double estimatedPrice;
    private Long createdAt; // Timestamp
    private Long expiresAt; // Timestamp
}
