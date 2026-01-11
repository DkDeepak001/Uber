package com.socket_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RideRequestDTO {
    private Long bookingId; // null for new requests
    private String requestId; // Temporary ID for tracking ride requests before booking is created
    private String userId;
    private Double pickupLatitude;
    private Double pickupLongitude;
    private Double dropoffLatitude;
    private Double dropoffLongitude;
    private Double price;
    private Long timeoutSeconds; // Timeout for driver to accept (default 30 seconds)
}
