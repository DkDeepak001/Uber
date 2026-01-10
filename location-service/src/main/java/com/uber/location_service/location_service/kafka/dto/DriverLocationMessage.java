package com.uber.location_service.location_service.kafka.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DriverLocationMessage {
    private String driverId;
    private double latitude;
    private double longitude;
}
