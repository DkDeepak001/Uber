package com.uber.location_service.location_service.kafka.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DriverSearchRequestMessage {
    private Long bookingId; // null for new requests
    private String requestId; // Temporary ID for tracking ride requests before booking is created
    private String userId;
    private double pickupLatitude;
    private double pickupLongitude;
    private double dropoffLatitude;
    private double dropoffLongitude;
    private double price;
}
