package com.socket_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RideRequestResponseDTO {
    private Long bookingId; // null for new requests
    private String requestId; // Temporary ID for tracking ride requests before booking is created
    private String driverId;
    private String action; // "ACCEPT" or "REJECT"
    private String message;
}
