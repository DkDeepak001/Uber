package com.socket_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DriverRideRequestDTO {
    private Long bookingId; // null for new requests
    private String requestId; // Temporary ID for tracking ride requests before booking is created
    private String userId;
    private Double pickupLatitude;
    private Double pickupLongitude;
    private Double dropoffLatitude;
    private Double dropoffLongitude;
    private Double price;
    private Long expiresAt; // Timestamp when request expires
    private String message; // Optional message to driver
}
