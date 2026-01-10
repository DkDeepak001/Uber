package com.booking_service.kafka.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DriverSearchRequestMessage {
    private Long bookingId;
    private String userId;
    private double pickupLatitude;
    private double pickupLongitude;
}
