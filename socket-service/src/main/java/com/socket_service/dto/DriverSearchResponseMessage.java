package com.socket_service.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DriverSearchResponseMessage {
    private Long bookingId; // null for new requests
    private String requestId; // Temporary ID for tracking ride requests before booking is created
    private String userId;
    private List<DriverLocationMessage> drivers;
}
